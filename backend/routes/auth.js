const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { generateOTP, sendLoginOTP, sendPasswordResetOTP, sendPasswordChangeNotification } = require('../utils/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Store signup OTPs temporarily (in production, use Redis or similar)
const signupOTPStore = new Map();
const otpStore = new Map();
const passwordResetOTPStore = new Map();

// Check if email exists
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const [users] = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE email = ?',
      [email]
    );

    const exists = users[0].count > 0;
    
    res.json({ exists });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Google authentication
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];

    console.log('Google auth payload:', { googleId, email, name });

    console.log('Checking for existing admin with email:', email);
    // First check if this email is designated as an admin
    const [adminCheck] = await db.query(
      'SELECT * FROM users WHERE email = ? AND role = ?',
      [email, 'admin']
    );

    // Check if user exists
    let [user] = await db.query(
      'SELECT * FROM users WHERE google_id = ? OR email = ?',
      [googleId, email]
    );

    if (user.length === 0) {
      // Create new user
      console.log('Creating new user with Google auth');
      const role = adminCheck.length > 0 ? 'admin' : 'user';
      console.log('Assigning role:', role);
      
      const [result] = await db.query(
        'INSERT INTO users (username, email, google_id, google_email, role, isVerified) VALUES (?, ?, ?, ?, ?, true)',
        [name, email, googleId, email, role]
      );
      [user] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    } else {
      // If user exists but is marked as admin in adminCheck, update their role
      if (adminCheck.length > 0 && user[0].role !== 'admin') {
        console.log('Updating existing user to admin role');
        await db.query(
          'UPDATE users SET role = ? WHERE id = ?',
          ['admin', user[0].id]
        );
        user[0].role = 'admin';
      }
      console.log('Existing user found:', { 
        id: user[0].id, 
        email: user[0].email, 
        role: user[0].role,
        hasGoogleId: !!user[0].google_id 
      });
      
      // Update existing user's Google info if not set
      if (!user[0].google_id) {
        console.log('Updating existing user with Google info');
        await db.query(
          'UPDATE users SET google_id = ?, google_email = ?, isVerified = true WHERE id = ?',
          [googleId, email, user[0].id]
        );
      }

      // Refresh user data after potential update
      [user] = await db.query('SELECT * FROM users WHERE id = ?', [user[0].id]);
    }

    // Check if user is blocked
    if (user[0].isBlocked) {
      console.log('Blocked user attempted login:', user[0].email);
      return res.status(403).json({ 
        message: 'Your account has been blocked. Please contact support.',
        error: 'Account blocked'
      });
    }

    // Update login tracking
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?',
      [user[0].id]
    );

    // Verify email domain for admin users
    if (user[0].role === 'admin') {
      const emailDomain = email.split('@')[1];
      const allowedDomains = ['gmail.com', 'example.com']; // Add your allowed domains
      if (!allowedDomains.includes(emailDomain)) {
        console.log('Unauthorized domain for admin login:', emailDomain);
        return res.status(403).json({
          message: 'Unauthorized email domain for admin access',
          error: 'Invalid domain'
        });
      }
    }

    console.log('Generating JWT for user:', { 
      id: user[0].id, 
      role: user[0].role 
    });

    // Generate JWT token with short expiration
    const jwtToken = jwt.sign(
      { 
        id: user[0].id, 
        role: user[0].role,
        email: user[0].email,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', jwtToken, {
      httpOnly: false, // Allow JavaScript access for Socket.IO
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }).json({
      message: 'Google authentication successful',
      user: {
        id: user[0].id,
        username: user[0].username,
        email: user[0].email,
        role: user[0].role
      }
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(500).json({ message: 'Failed to authenticate with Google' });
  }
});

// Regular login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }
    
    const user = rows[0];
    
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
    }
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Incorrect password. Please try again.' });
    }

    // Clear any existing OTP for this email
    otpStore.delete(email);

    const otp = generateOTP();
    const expiryTime = Date.now() + 5 * 60 * 1000;
    
    otpStore.set(email, {
      otp,
      expiryTime,
      userId: user.id,
      role: user.role
    });

    const emailSent = await sendLoginOTP(email, otp);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
    }
    
    res.json({ 
      message: 'OTP sent to your email',
      requiresOTP: true
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const storedData = otpStore.get(email);

    if (!storedData || Date.now() > storedData.expiryTime) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP expired or invalid. Please try logging in again.' });
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'OTP must be exactly 6 digits' });
    }

    if (otp !== storedData.otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // Get user data
    const [user] = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [storedData.userId]
    );

    if (!user.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = jwt.sign({ id: storedData.userId, role: storedData.role }, process.env.JWT_SECRET);
    otpStore.delete(email);

    res.cookie('token', token, { 
      httpOnly: false, // Allow JavaScript access for Socket.IO
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }).json({ 
      message: 'Login successful!',
      user: user[0]
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'An error occurred during verification' });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    // First check if user exists and get user data
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    const user = users[0];

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    // Store new OTP data
    otpStore.set(email, {
      otp,
      expiryTime,
      userId: user.id,
      role: user.role
    });

    const emailSent = await sendLoginOTP(email, otp);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
    }

    res.json({ 
      message: 'New OTP sent to your email',
      success: true
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/'
  }).json({ message: 'Logged out' });
});

module.exports = router;