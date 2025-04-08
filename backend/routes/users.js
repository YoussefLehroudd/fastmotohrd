const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { verifyToken } = require('../middleware/auth');
const { generateOTP, sendLoginOTP, sendPasswordChangeNotification, sendBookingCancellationEmail } = require('../utils/emailService');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID
});

// Store OTPs temporarily (in production, use Redis or similar)

// Get user bookings
router.get('/bookings', verifyToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        b.*,
        m.title as motorTitle,
        m.imageUrl as motorImage,
        COALESCE(ml.city, '') as city,
        COALESCE(ml.address, '') as address,
        COALESCE(r.rating, 0) as rating,
        COALESCE(p.status, 'pending') as paymentStatus,
        COALESCE(m.brand, '') as brand,
        COALESCE(m.model, '') as model,
        COALESCE(m.year, 0) as year
      FROM bookings b
      INNER JOIN motors m ON b.motorId = m.id
      LEFT JOIN motor_locations ml ON ml.motorId = m.id
      LEFT JOIN reviews r ON r.motor_id = m.id AND r.user_id = b.userId
      LEFT JOIN payments p ON p.bookingId = b.id
      WHERE b.userId = ?
    `;
    
    const values = [req.user.id];
    
    if (status) {
      query += ' AND b.status = ?';
      values.push(status);
    }
    
    query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    values.push(parseInt(limit), offset);

    const [bookings] = await db.query(query, values);
    
    // Get total count for pagination
    const [totalCount] = await db.query(
      'SELECT COUNT(*) as count FROM bookings b INNER JOIN motors m ON b.motorId = m.id WHERE b.userId = ?' + (status ? ' AND b.status = ?' : ''),
      status ? [req.user.id, status] : [req.user.id]
    );

    // Transform dates to ISO string format
    const formattedBookings = bookings.map(booking => ({
      ...booking,
      startDate: booking.startDate ? booking.startDate.toISOString().split('T')[0] : null,
      endDate: booking.endDate ? booking.endDate.toISOString().split('T')[0] : null,
      created_at: booking.created_at ? booking.created_at.toISOString() : null
    }));

    res.json({
      bookings: formattedBookings,
      pagination: {
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit),
        current: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ 
      message: 'Error fetching bookings',
      error: error.message 
    });
  }
});

// Get single booking details
router.get('/bookings/:id', verifyToken, async (req, res) => {
  try {
    const [booking] = await db.query(
      `SELECT b.*, m.title as motorTitle, m.imageUrl as motorImage, 
              m.brand, m.model, m.year,
              ml.city, ml.address, ml.pickupInstructions,
              COALESCE(r.rating, 0) as rating, r.comment as review,
              p.status as paymentStatus, p.proofUrl as paymentProof
       FROM bookings b
       LEFT JOIN motors m ON b.motorId = m.id
       LEFT JOIN motor_locations ml ON ml.motorId = m.id
       LEFT JOIN reviews r ON r.motor_id = m.id AND r.user_id = b.userId
       LEFT JOIN payments p ON p.bookingId = b.id
       WHERE b.id = ? AND b.userId = ?`,
      [req.params.id, req.user.id]
    );

    if (!booking.length) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking[0]);
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ message: 'Error fetching booking details' });
  }
});

// Cancel booking
router.patch('/bookings/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    
    // Get booking details
    const [booking] = await db.query(
      'SELECT * FROM bookings WHERE id = ? AND userId = ?',
      [req.params.id, req.user.id]
    );

    if (!booking.length) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking[0].status !== 'pending' && booking[0].status !== 'confirmed') {
      return res.status(400).json({ 
        message: 'Cannot cancel booking with current status' 
      });
    }

    // Check if start date is within 24 hours
    const startDate = new Date(booking[0].startDate);
    const now = new Date();
    const hoursUntilStart = (startDate - now) / (1000 * 60 * 60);
    
    if (hoursUntilStart < 24) {
      return res.status(400).json({ 
        message: 'Cannot cancel booking within 24 hours of start time' 
      });
    }

    // Update booking status
    await db.query(
      'UPDATE bookings SET status = ?, cancellationReason = ? WHERE id = ?',
      ['cancelled', reason, req.params.id]
    );

    // Send cancellation email
    const [user] = await db.query(
      'SELECT email FROM users WHERE id = ?',
      [req.user.id]
    );
    
    await sendBookingCancellationEmail(user[0].email, {
      bookingId: req.params.id,
      reason: reason
    });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Error cancelling booking' });
  }
});

const otpStore = new Map();

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../frontend/public/uploads/profiles'))
  },
  filename: function (req, file, cb) {
    cb(null, 'profile-' + Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [profile] = await db.query(
      'SELECT id, username, email, phone, countryCode, address, profileImageUrl, google_email FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!profile.length) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const profileWithGoogle = {
      ...profile[0],
      googleEmail: profile[0].google_email
    };
    
    res.json(profileWithGoogle);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
router.patch('/profile', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { name, phone, countryCode, address } = req.body;
    const updates = [];
    const values = [];
    
    if (name) {
      updates.push('username = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (countryCode !== undefined) {
      updates.push('countryCode = ?');
      values.push(countryCode);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }
    if (req.file) {
      updates.push('profileImageUrl = ?');
      values.push('/uploads/profiles/' + req.file.filename);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    values.push(req.user.id);
    
    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch and return updated profile
    const [profile] = await db.query(
      'SELECT id, username, email, phone, countryCode, address, profileImageUrl FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json(profile[0]);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Change email with OTP verification
router.post('/change-email', verifyToken, async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;
    
    // Verify current password
    const [user] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const validPassword = await bcrypt.compare(currentPassword, user[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Check if new email already exists
    const [existingEmail] = await db.query('SELECT id FROM users WHERE email = ?', [newEmail]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate and store OTP
    const otp = generateOTP();
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
    
    otpStore.set(newEmail, {
      otp,
      expiryTime,
      userId: req.user.id,
      type: 'email-change'
    });

    await sendLoginOTP(newEmail, otp);
    
    res.json({ 
      message: 'OTP sent to new email for verification',
      requiresOTP: true
    });
  } catch (error) {
    console.error('Error initiating email change:', error);
    res.status(500).json({ message: 'Error changing email' });
  }
});

// Verify OTP and complete email change
router.post('/verify-email-change', verifyToken, async (req, res) => {
  try {
    const { newEmail, otp } = req.body;
    const storedData = otpStore.get(newEmail);

    if (!storedData || Date.now() > storedData.expiryTime || storedData.type !== 'email-change') {
      otpStore.delete(newEmail);
      return res.status(400).json({ message: 'OTP expired or invalid' });
    }

    if (otp !== storedData.otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update email
    await db.query('UPDATE users SET email = ? WHERE id = ?', [newEmail, req.user.id]);
    otpStore.delete(newEmail);

    res.json({ message: 'Email updated successfully' });
  } catch (error) {
    console.error('Error verifying email change:', error);
    res.status(500).json({ message: 'Error updating email' });
  }
});

// Change password
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Verify current password
    const [user] = await db.query('SELECT password, email FROM users WHERE id = ?', [req.user.id]);
    const validPassword = await bcrypt.compare(currentPassword, user[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Validate new password strength
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
      return res.status(400).json({ 
        message: 'New password must be at least 8 characters with uppercase, lowercase, and numbers' 
      });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
    
    // Send notification email
    await sendPasswordChangeNotification(user[0].email);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
});


// Link Google account
router.post('/link-google', verifyToken, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Invalid token format' });
    }

    // Verify Google token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      if (!ticket) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const payload = ticket.getPayload();
      const googleId = payload['sub'];
      const googleEmail = payload['email'];

      // Check if Google account is already linked to another user
      const [existingUser] = await db.query(
        'SELECT id FROM users WHERE (google_id = ? OR google_email = ?) AND id != ?',
        [googleId, googleEmail, req.user.id]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({ 
          message: 'This Google account is already linked to another user' 
        });
      }

      // Link Google account to current user
      await db.query(
        'UPDATE users SET google_id = ?, google_email = ? WHERE id = ?',
        [googleId, googleEmail, req.user.id]
      );

      res.json({ 
        message: 'Google account linked successfully',
        googleEmail 
      });
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ 
        message: 'Invalid Google token',
        error: error.message 
      });
    }
  } catch (error) {
    console.error('Error linking Google account:', error);
    res.status(500).json({ message: 'Error linking Google account' });
  }
});

// Unlink Google account
router.post('/unlink-google', verifyToken, async (req, res) => {
  try {
    await db.query(
      'UPDATE users SET google_id = NULL, google_email = NULL WHERE id = ?',
      [req.user.id]
    );

    res.json({ message: 'Google account unlinked successfully' });
  } catch (error) {
    console.error('Error unlinking Google account:', error);
    res.status(500).json({ message: 'Error unlinking Google account' });
  }
});

module.exports = router;
