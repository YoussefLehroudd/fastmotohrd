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

router.post('/google', async (req, res) => {
  // console.log('================================================');
  // console.log('🚀 GOOGLE AUTH ROUTE HIT - START OF PROCESS 🚀');
  // console.log('Time:', new Date().toISOString());
  // console.log('Request Body:', req.body);
  // console.log('================================================');
  
  try {
    const { token } = req.body;
    
    // Validate token
    if (!token) {
      console.log('❌ ERROR: No token in request body');
      console.log('Request body received:', req.body);
      return res.status(400).json({ message: 'Token is required' });
    }
    
    // console.log('✓ Token validation passed');
    // console.log('Token length:', token.length);
    // console.log('Token preview:', token.substring(0, 20) + '...');
    
    // console.log('⏳ Verifying token with Google...');
    // console.log('Using Client ID:', process.env.GOOGLE_CLIENT_ID);

    let googleId, email, name;
    
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      // console.log('✓ Token verified with Google successfully');

      const payload = ticket.getPayload();
      // console.log('📦 Full Google payload received:', payload);
      
      googleId = payload['sub'];
      email = payload['email'];
      name = payload['name'];
      // console.log('👤 Extracted user info:', { googleId, email, name });
    } catch (verifyError) {
      // console.log('❌ Google verification failed');
      // console.log('Error details:', verifyError);
      // console.log('Error message:', verifyError.message);
      // console.log('Error stack:', verifyError.stack);
      return res.status(401).json({ 
        message: 'Failed to verify Google token',
        error: verifyError.message 
      });
    }

    // console.log('🔍 Looking up user in database...');
    // console.log('Search criteria:', { googleId, email });
    
    let user;
    try {
      [user] = await db.query(
        'SELECT * FROM users WHERE google_id = ? OR email = ?',
        [googleId, email]
      );
      // console.log('Database query successful');
      // console.log('Results found:', user.length);
    } catch (dbError) {
      console.log('❌ Database lookup failed');
      console.log('Error:', dbError.message);
      throw dbError;
    }

    if (user.length === 0) {
      // console.log('\n📝 New User Registration Process:');
      // console.log('├─ Creating new user account');
      // console.log('├─ Email:', email);
      // console.log('└─ Name:', name);
      
      try {
        const [result] = await db.query(
          'INSERT INTO users (username, email, google_id, google_email, role, isVerified) VALUES (?, ?, ?, ?, ?, true)',
          [name, email, googleId, email, 'user']
        );
        console.log('✓ Insert successful, new user ID:', result.insertId);
        
        [user] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        console.log('✓ User data retrieved');
      } catch (createError) {
        console.log('❌ Failed to create new user');
        console.log('Error:', createError.message);
        throw createError;
      }
    } else {
      // console.log('\n👤 Existing User Processing:');
      // console.log('├─ User found:', user[0].email);
      // console.log('└─ ID:', user[0].id);
      
      if (!user[0].google_id) {
        // console.log('\n🔄 Linking Google Account:');
        // console.log('├─ Updating user:', user[0].id);
        // console.log('└─ Adding Google credentials');
        
        try {
          await db.query(
            'UPDATE users SET google_id = ?, google_email = ?, isVerified = true WHERE id = ?',
            [googleId, email, user[0].id]
          );
          console.log('✓ Google account linked successfully');
          
          [user] = await db.query('SELECT * FROM users WHERE id = ?', [user[0].id]);
          console.log('✓ Updated user data retrieved');
        } catch (updateError) {
          console.log('❌ Failed to link Google account');
          console.log('Error:', updateError.message);
          throw updateError;
        }
      }
    }

    if (user[0].isBlocked) {
      // console.log('🚫 Blocked user attempted login:', email);
      return res.status(403).json({ 
        message: 'Your account has been blocked. Please contact support.',
        error: 'Account blocked'
      });
    }

    // console.log('\n📝 Updating Login Stats:');
    try {
      await db.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?',
        [user[0].id]
      );
      // console.log('✓ Login timestamp updated');
      // console.log('├─ User ID:', user[0].id);
      // console.log('└─ Time:', new Date().toISOString());
    } catch (updateError) {
      console.log('⚠️ Failed to update login stats');
      console.log('Error:', updateError.message);
      // Continue despite this error as it's not critical
    }

    // console.log('\n🔑 Generating Authentication Token:');
    // console.log('├─ User ID:', user[0].id);
    // console.log('├─ Role:', user[0].role);
    // console.log('└─ Email:', user[0].email);

    let jwtToken;
    try {
      jwtToken = jwt.sign(
        { id: user[0].id, role: user[0].role, email: user[0].email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      // console.log('✓ JWT generated successfully');
    } catch (jwtError) {
      console.log('❌ JWT generation failed');
      console.log('Error:', jwtError.message);
      throw jwtError;
    }

    // console.log('\n🍪 Setting Authentication Cookie:');
    // console.log('├─ HTTP Only:', false);
    // console.log('├─ Secure:', process.env.NODE_ENV === 'production');
    // console.log('└─ Max Age: 24h');

    try {
      res.cookie('token', jwtToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000
      }).json({
        message: 'Google authentication successful',
        user: {
          id: user[0].id,
          username: user[0].username,
          email: user[0].email,
          role: user[0].role
        }
      });
      // console.log('\n✅ Authentication Complete:');
      // console.log('├─ Status: Success');
      // console.log('└─ User:', user[0].email);
      // console.log('================================================');
    } catch (responseError) {
      console.log('❌ Failed to send response');
      console.log('Error:', responseError.message);
      throw responseError;
    }
  } catch (error) {
    console.log('\n❌ AUTHENTICATION ERROR ❌');
    console.log('├─ Time:', new Date().toISOString());
    console.log('├─ Type:', error.name || 'Unknown Error');
    console.log('├─ Message:', error.message);
    console.log('├─ Stack:', error.stack);
    if (error.code) console.log('├─ Error Code:', error.code);
    if (error.response) console.log('└─ Response:', error.response.data);
    else console.log('└─ No additional error data available');
    console.log('================================================');

    // Send appropriate error response
    const errorResponse = {
      message: 'Failed to authenticate with Google',
      error: error.message,
      type: error.name || 'Unknown Error'
    };

    // Use appropriate status code based on error type
    const statusCode = error.code === 'ECONNREFUSED' ? 503 : // Service unavailable
                      error.name === 'JsonWebTokenError' ? 401 : // Unauthorized
                      error.name === 'TokenExpiredError' ? 401 : // Unauthorized
                      500; // Internal server error (default)

    res.status(statusCode).json(errorResponse);
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