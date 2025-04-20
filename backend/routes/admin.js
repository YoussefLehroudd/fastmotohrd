const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

// Get dashboard statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = {};
    const today = new Date().toISOString().split('T')[0];
    
    // Check if tables exist and are accessible
    try {
      await db.query('SELECT 1 FROM users LIMIT 1');
      await db.query('SELECT 1 FROM motors LIMIT 1');
      await db.query('SELECT 1 FROM bookings LIMIT 1');
      await db.query('SELECT 1 FROM payments LIMIT 1');
    } catch (error) {
      console.error('Table access error:', error);
      throw new Error('Database tables are not properly set up. Please ensure all migrations have been run.');
    }

    // Get user stats with today's count
    const [userStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as regularUsers,
        SUM(CASE WHEN role = 'seller' THEN 1 ELSE 0 END) as sellers,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) as newToday,
        SUM(CASE WHEN isBlocked = 0 THEN 1 ELSE 0 END) as active
      FROM users
    `, [today]);
    stats.users = userStats[0];

    // Get motor stats with average daily rate
    const [motorStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN isAvailableForRent = true THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN isAvailableForRent = false THEN 1 ELSE 0 END) as rented,
        CAST(AVG(dailyRate) AS DECIMAL(10,2)) as avgDailyRate
      FROM motors
    `);
    stats.motors = motorStats[0];

    // Get booking stats with today's completed bookings
    const [bookingStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'completed' AND DATE(created_at) = ? THEN 1 ELSE 0 END) as completedToday,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM bookings
    `, [today]);
    stats.bookings = bookingStats[0];

    // Get payment stats with today's amount and payment methods
    const [paymentStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        CAST(SUM(amount) AS DECIMAL(10,2)) as totalAmount,
        CAST(SUM(CASE WHEN DATE(created_at) = ? THEN amount ELSE 0 END) AS DECIMAL(10,2)) as todayAmount,
        CAST(AVG(amount) AS DECIMAL(10,2)) as avgBookingValue,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) as validated,
        SUM(CASE WHEN paymentMethod = 'cash_on_delivery' THEN 1 ELSE 0 END) as cashPayments,
        SUM(CASE WHEN paymentMethod = 'bank_transfer' THEN 1 ELSE 0 END) as bankTransfers,
        SUM(CASE WHEN paymentMethod = 'stripe' THEN 1 ELSE 0 END) as stripePayments
      FROM payments
    `, [today]);
    stats.payments = paymentStats[0];

    // Get recent activity
    const [recentUsers] = await db.query(`
      SELECT id, username, email, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const [recentBookings] = await db.query(`
      SELECT b.id, b.status, b.created_at, b.totalPrice,
             m.title as motorTitle,
             u.username as userName,
             COALESCE(s.username, 'N/A') as sellerName,
             COALESCE(p.status, 'pending') as paymentStatus,
             COALESCE(p.paymentMethod, 'not_set') as paymentMethod,
             p.proofUrl,
             p.validatedAt,
             COALESCE(v.username, 'not_validated') as validatedByUser
      FROM bookings b
      LEFT JOIN motors m ON b.motorId = m.id
      LEFT JOIN users u ON b.userId = u.id
      LEFT JOIN users s ON m.sellerId = s.id
      LEFT JOIN payments p ON b.id = p.bookingId
      LEFT JOIN users v ON p.validatedBy = v.id
      ORDER BY b.created_at DESC
      LIMIT 5
    `);

    stats.recentActivity = {
      users: recentUsers,
      bookings: recentBookings
    };

    // Get top browsers from user_sessions with simplified browser names
    const [topBrowsers] = await db.query(`
      SELECT 
        CASE
          WHEN browser LIKE '%Chrome%' THEN 'Google Chrome'
          WHEN browser LIKE '%Firefox%' THEN 'Mozilla Firefox'
          WHEN browser LIKE '%Safari%' AND browser NOT LIKE '%Chrome%' THEN 'Safari'
          WHEN browser LIKE '%Edge%' THEN 'Microsoft Edge'
          WHEN browser LIKE '%Opera%' THEN 'Opera'
          ELSE 'Other'
        END as browser,
        COUNT(*) as sessions
      FROM user_sessions
      GROUP BY browser
      ORDER BY sessions DESC
      LIMIT 5
    `);

    // Get top most visited pages from page_views
    const [topPages] = await db.query(`
      SELECT page_url as url, COUNT(*) as views
      FROM page_views
      GROUP BY page_url
      ORDER BY views DESC
      LIMIT 5
    `);

    stats.topBrowsers = topBrowsers;
    stats.topPages = topPages;

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      message: 'Error fetching statistics',
      error: error.message 
    });
  }
});

// Get users list with pagination and filters
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT id, username, email, role, isBlocked, isVerified, created_at FROM users WHERE 1=1';
    const values = [];
    
    if (role) {
      query += ' AND role = ?';
      values.push(role);
    }
    
    if (search) {
      query += ' AND (username LIKE ? OR email LIKE ?)';
      values.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    values.push(parseInt(limit), offset);

    const [users] = await db.query(query, values);
    
    // Get total count for pagination
    const [totalCount] = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE 1=1' + 
      (role ? ' AND role = ?' : '') +
      (search ? ' AND (username LIKE ? OR email LIKE ?)' : ''),
      values.slice(0, -2)
    );

    res.json({
      users,
      pagination: {
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit),
        current: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      message: 'Error fetching users',
      error: error.message 
    });
  }
});

// Update user status (block/unblock)
router.patch('/users/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { isBlocked } = req.body;
    
    await db.query(
      'UPDATE users SET isBlocked = ? WHERE id = ?',
      [isBlocked, req.params.id]
    );

    res.json({ message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully` });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ 
      message: 'Error updating user status',
      error: error.message 
    });
  }
});

// Update user role
router.patch('/users/:id/role', authenticateAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    await db.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, req.params.id]
    );

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ 
      message: 'Error updating user role',
      error: error.message 
    });
  }
});

// Get motors list with pagination and filters
router.get('/motors', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT m.*, u.username as sellerName, 
             COALESCE(l.city, 'N/A') as city,
             COALESCE(l.address, '') as address
      FROM motors m 
      LEFT JOIN users u ON m.sellerId = u.id 
      LEFT JOIN motor_locations l ON m.id = l.motorId AND l.isActive = 1
      WHERE 1=1
    `;
    const values = [];
    
    if (status === 'available') {
      query += ' AND m.isAvailableForRent = true';
    } else if (status === 'rented') {
      query += ' AND m.isAvailableForRent = false';
    }
    
    if (type) {
      query += ' AND m.motorType = ?';
      values.push(type);
    }
    
    if (search) {
      query += ' AND (m.title LIKE ? OR m.brand LIKE ? OR m.model LIKE ?)';
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    values.push(parseInt(limit), offset);

    const [motors] = await db.query(query, values);
    
    // Get total count for pagination
    const [totalCount] = await db.query(
      'SELECT COUNT(*) as count FROM motors m WHERE 1=1' + 
      (status === 'available' ? ' AND m.isAvailableForRent = true' : '') +
      (status === 'rented' ? ' AND m.isAvailableForRent = false' : '') +
      (type ? ' AND m.motorType = ?' : '') +
      (search ? ' AND (m.title LIKE ? OR m.brand LIKE ? OR m.model LIKE ?)' : ''),
      values.slice(0, -2)
    );

    res.json({
      motors,
      pagination: {
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit),
        current: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Error fetching motors:', error);
    res.status(500).json({ 
      message: 'Error fetching motors',
      error: error.message 
    });
  }
});

// Get bookings list with pagination and filters
router.get('/bookings', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT b.id, b.motorId, b.userId, b.startDate, b.endDate, b.status, 
             b.totalPrice, b.created_at,
             COALESCE(m.title, 'Deleted Motor') as motorTitle, 
             COALESCE(u.username, 'Deleted User') as userName,
             COALESCE(s.username, 'N/A') as sellerName,
             COALESCE(p.status, 'pending') as paymentStatus,
             p.created_at as paymentDate,
             COALESCE(p.paymentMethod, 'not_set') as paymentMethod,
             p.proofUrl,
             COALESCE(p.notes, '') as paymentNotes,
             COALESCE(v.username, 'not_validated') as validatedByUser,
             p.validatedAt,
             COALESCE(p.stripePaymentIntentId, '') as stripePaymentIntentId,
             COALESCE(p.stripeChargeId, '') as stripeChargeId, 
             COALESCE(l.city, 'N/A') as city,
             COALESCE(l.address, '') as address
      FROM bookings b
      LEFT JOIN motors m ON b.motorId = m.id
      LEFT JOIN users u ON b.userId = u.id
      LEFT JOIN users s ON m.sellerId = s.id
      LEFT JOIN payments p ON b.id = p.bookingId
      LEFT JOIN users v ON p.validatedBy = v.id
      LEFT JOIN motor_locations l ON m.id = l.motorId AND l.isActive = 1
      WHERE 1=1
    `;
    const values = [];
    
    if (status) {
      query += ' AND b.status = ?';
      values.push(status);
    }
    
    if (search) {
      query += ' AND (m.title LIKE ? OR u.username LIKE ? OR s.username LIKE ?)';
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    values.push(parseInt(limit), offset);

    const [bookings] = await db.query(query, values);
    
    // Get total count for pagination
    const [totalCount] = await db.query(
      'SELECT COUNT(*) as count FROM bookings b ' +
      'LEFT JOIN motors m ON b.motorId = m.id ' +
      'LEFT JOIN users u ON b.userId = u.id ' +
      'LEFT JOIN users s ON m.sellerId = s.id ' +
      'WHERE 1=1' + 
      (status ? ' AND b.status = ?' : '') +
      (search ? ' AND (m.title LIKE ? OR u.username LIKE ? OR s.username LIKE ?)' : ''),
      values.slice(0, -2)
    );

    res.json({
      bookings,
      pagination: {
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit),
        current: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      message: 'Error fetching bookings',
      error: error.message 
    });
  }
});

module.exports = router;
