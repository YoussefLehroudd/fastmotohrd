const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { authenticateSeller } = require('../middleware/auth');
const { generateOTP, sendLoginOTP, sendPasswordChangeNotification } = require('../utils/emailService');
const multer = require('multer');
const path = require('path');

// Store OTPs temporarily (in production, use Redis or similar)
const otpStore = new Map();

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../frontend/public/uploads/profiles');
    cb(null, uploadPath)
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

// Get seller profile by ID (public)
router.get('/profile/:id', async (req, res) => {
  try {
    const [profile] = await db.query(
      'SELECT id, username as name, bio, profileImageUrl FROM users WHERE id = ? AND role = "seller"',
      [req.params.id]
    );

    if (!profile.length) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    res.json(profile[0]);
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Get seller profile (authenticated)
router.get('/profile', authenticateSeller, async (req, res) => {
  try {
    const [profile] = await db.query(
      'SELECT id, username, email, phone, countryCode, address, bio, profileImageUrl FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!profile.length) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile[0]);
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update seller profile
router.patch('/profile', authenticateSeller, upload.single('image'), async (req, res) => {
  try {
    const { name, email, phone, countryCode, address, bio } = req.body;
    const updates = [];
    const values = [];
    
    if (name) {
      updates.push('username = ?');
      values.push(name);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
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
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    values.push(req.user.id);
    
    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Update profile image URL if image was uploaded
    if (req.file) {
      const imageUrl = `/uploads/profiles/${req.file.filename}`;
      await db.query('UPDATE users SET profileImageUrl = ? WHERE id = ?', [imageUrl, req.user.id]);
    }

    // Fetch and return updated profile
    const [profile] = await db.query(
      'SELECT id, username, email, phone, countryCode, address, bio, profileImageUrl FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json(profile[0]);
  } catch (error) {
    console.error('Error updating seller profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get seller dashboard stats
router.get('/stats', authenticateSeller, async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Get total motors count
    const [motorsCount] = await db.query(
      'SELECT COUNT(*) as total FROM motors WHERE sellerId = ?',
      [sellerId]
    );

    // Get active bookings count
    const [activeBookings] = await db.query(
      `SELECT COUNT(*) as total FROM bookings b 
       JOIN motors m ON b.motorId = m.id 
       WHERE m.sellerId = ? AND b.status = 'confirmed'`,
      [sellerId]
    );

    // Get total revenue
    const [revenue] = await db.query(
      `SELECT COALESCE(SUM(p.amount), 0) as total 
       FROM payments p 
       JOIN bookings b ON p.bookingId = b.id 
       JOIN motors m ON b.motorId = m.id 
       WHERE m.sellerId = ? AND p.status = 'paid'`,
      [sellerId]
    );

    // Get average rating
    const [rating] = await db.query(
      `SELECT COALESCE(AVG(r.rating), 0) as average 
       FROM reviews r 
       JOIN motors m ON r.motor_id = m.id 
       WHERE m.sellerId = ?`,
      [sellerId]
    );

    // Get recent bookings
    const [recentBookings] = await db.query(
      `SELECT b.id, b.startDate, b.endDate, b.status, b.totalPrice,
              m.title as motorName, u.username as customerName
       FROM bookings b 
       JOIN motors m ON b.motorId = m.id 
       JOIN users u ON b.userId = u.id
       WHERE m.sellerId = ?
       ORDER BY b.created_at DESC LIMIT 5`,
      [sellerId]
    );

    res.json({
      stats: {
        totalMotors: motorsCount[0].total,
        activeBookings: activeBookings[0].total,
        totalRevenue: revenue[0].total,
        averageRating: rating[0].average || 0
      },
      recentBookings
    });
  } catch (error) {
    console.error('Error fetching seller stats:', error);
    res.status(500).json({ message: 'Error fetching seller stats' });
  }
});

// Get seller orders
router.get('/orders', authenticateSeller, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const [orders] = await db.query(
      `SELECT b.id, b.startDate, b.endDate, b.status, b.totalPrice,
              m.title as motorName, u.username as customerName,
              CASE 
                WHEN b.endDate IS NULL THEN 'SALE'
                ELSE 'RENTAL'
              END as type
       FROM bookings b 
       JOIN motors m ON b.motorId = m.id 
       JOIN users u ON b.userId = u.id
       WHERE m.sellerId = ?
       ORDER BY b.created_at DESC`,
      [sellerId]
    );

    res.json(orders);
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Update payment status
router.patch('/payments/:id', authenticateSeller, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const sellerId = req.user.id;

    // Verify the payment belongs to the seller's motor
    const [payment] = await db.query(
      `SELECT p.id 
       FROM payments p 
       JOIN bookings b ON p.bookingId = b.id 
       JOIN motors m ON b.motorId = m.id 
       WHERE p.id = ? AND m.sellerId = ?`,
      [id, sellerId]
    );

    if (!payment.length) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    await db.query(
      'UPDATE payments SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Error updating payment status' });
  }
});

// Get seller payments
router.get('/payments', authenticateSeller, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const [payments] = await db.query(
      `SELECT p.id, p.amount, p.status, p.paymentMethod, p.created_at as date,
              m.title as motorName, u.username as customerName
       FROM payments p 
       JOIN bookings b ON p.bookingId = b.id 
       JOIN motors m ON b.motorId = m.id 
       JOIN users u ON b.userId = u.id
       WHERE m.sellerId = ?
       ORDER BY p.created_at DESC`,
      [sellerId]
    );

    // Calculate payment stats
    const [stats] = await db.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) as totalRevenue,
        COALESCE(SUM(CASE 
          WHEN p.status = 'paid' 
          AND MONTH(p.created_at) = MONTH(CURRENT_DATE) 
          THEN p.amount ELSE 0 END), 0) as monthlyRevenue,
        COALESCE(SUM(CASE 
          WHEN p.status = 'pending'
          THEN p.amount ELSE 0 END), 0) as pendingPayments,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) as completedPayments
       FROM payments p 
       JOIN bookings b ON p.bookingId = b.id 
       JOIN motors m ON b.motorId = m.id 
       WHERE m.sellerId = ?`,
      [sellerId]
    );

    res.json({
      transactions: payments,
      stats: stats[0]
    });
  } catch (error) {
    console.error('Error fetching seller payments:', error);
    res.status(500).json({ message: 'Error fetching payments' });
  }
});

// Get seller reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const sellerId = req.params.id;
    const [reviews] = await db.query(
      `SELECT r.id, r.rating, r.comment, r.seller_response, r.created_at as date,
              m.title as motorName, u.username as customerName
       FROM reviews r 
       JOIN motors m ON r.motor_id = m.id 
       JOIN users u ON r.user_id = u.id
       WHERE m.sellerId = ?
       ORDER BY r.created_at DESC`,
      [sellerId]
    );

    // Calculate review stats
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as totalReviews,
        COALESCE(AVG(rating), 0) as averageRating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as fiveStars,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as fourStars,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as threeStars,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as twoStars,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as oneStar
       FROM reviews r 
       JOIN motors m ON r.motor_id = m.id 
       WHERE m.sellerId = ?`,
      [sellerId]
    );

    // Transform stats to match frontend expected format
    const transformedStats = {
      totalReviews: parseInt(stats[0].totalReviews) || 0,
      averageRating: parseFloat(stats[0].averageRating) || 0,
      ratingBreakdown: {
        5: stats[0].fiveStars || 0,
        4: stats[0].fourStars || 0,
        3: stats[0].threeStars || 0,
        2: stats[0].twoStars || 0,
        1: stats[0].oneStar || 0
      }
    };

    res.json({
      reviews,
      stats: transformedStats
    });
  } catch (error) {
    console.error('Error fetching seller reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// Add response to a review
router.post('/reviews/:id/respond', authenticateSeller, async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const sellerId = req.user.id;

    // Verify the review belongs to the seller's motor
    const [review] = await db.query(
      `SELECT r.id 
       FROM reviews r 
       JOIN motors m ON r.motor_id = m.id 
       WHERE r.id = ? AND m.sellerId = ?`,
      [id, sellerId]
    );

    if (!review.length) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await db.query(
      'UPDATE reviews SET seller_response = ? WHERE id = ?',
      [response, id]
    );

    res.json({ message: 'Response added successfully' });
  } catch (error) {
    console.error('Error adding review response:', error);
    res.status(500).json({ message: 'Error adding response' });
  }
});

// Change email with OTP verification
router.post('/change-email', authenticateSeller, async (req, res) => {
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
router.post('/verify-email-change', authenticateSeller, async (req, res) => {
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
router.post('/change-password', authenticateSeller, async (req, res) => {
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

module.exports = router;
