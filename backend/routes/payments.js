const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// Get payment for a specific booking
router.get('/booking/:id', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const [payment] = await connection.query(
      `SELECT p.*, m.title as motorName, u.username as customerName
       FROM payments p
       JOIN bookings b ON p.bookingId = b.id
       JOIN motors m ON b.motorId = m.id
       JOIN users u ON b.userId = u.id
       WHERE p.bookingId = ?`,
      [req.params.id]
    );

    if (!payment.length) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment[0]);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Error fetching payment' });
  } finally {
    connection.release();
  }
});

// Get all payments for a seller
router.get('/', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    // Get all payments for motors owned by the seller
    const [transactions] = await connection.query(
      `SELECT p.*, b.created_at, m.title as motorName, u.username as customerName
       FROM payments p
       JOIN bookings b ON p.bookingId = b.id
       JOIN motors m ON b.motorId = m.id
       JOIN users u ON b.userId = u.id
       WHERE m.sellerId = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    // Calculate stats
    const [stats] = await connection.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END), 0) as pendingPayments,
        COALESCE(SUM(CASE WHEN p.status = 'validated' THEN p.amount ELSE 0 END), 0) as completedPayments,
        COALESCE(SUM(CASE WHEN p.status = 'validated' AND b.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN p.amount ELSE 0 END), 0) as monthlyRevenue,
        COALESCE(SUM(CASE WHEN p.status = 'validated' AND YEARWEEK(b.created_at) = YEARWEEK(NOW()) THEN p.amount ELSE 0 END), 0) as weeklyRevenue,
        COALESCE(SUM(CASE WHEN p.status = 'validated' AND DATE(b.created_at) = CURDATE() THEN p.amount ELSE 0 END), 0) as dailyRevenue,
        COALESCE(SUM(CASE WHEN p.status = 'validated' THEN p.amount ELSE 0 END), 0) as totalRevenue
       FROM payments p
       JOIN bookings b ON p.bookingId = b.id
       JOIN motors m ON b.motorId = m.id
       WHERE m.sellerId = ?`,
      [req.user.id]
    );

    res.json({
      transactions,
      stats: stats[0]
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Error fetching payments' });
  } finally {
    connection.release();
  }
});

// Validate payment
router.post('/:id/validate', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const paymentId = req.params.id;

    await connection.beginTransaction();

    // Get payment and booking details
    const [payment] = await connection.query(
      `SELECT p.*, m.sellerId, m.title as motorName, u.id as userId
       FROM payments p
       JOIN bookings b ON p.bookingId = b.id
       JOIN motors m ON b.motorId = m.id
       JOIN users u ON b.userId = u.id
       WHERE p.id = ?`,
      [paymentId]
    );

    if (!payment.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify user is the seller
    if (payment[0].sellerId !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ message: 'Not authorized to validate this payment' });
    }

    // Update payment status to validated
    await connection.query(
      'UPDATE payments SET status = ? WHERE id = ?',
      ['validated', paymentId]
    );

    // Create notification for user
    await connection.query(
      `INSERT INTO notifications (userId, content, type, actionUrl, priority)
       VALUES (?, ?, 'payment', ?, 'high')`,
      [
        payment[0].userId,
        `Your payment for ${payment[0].motorName} has been validated`,
        `/bookings/${payment[0].bookingId}`
      ]
    );

    await connection.commit();
    res.json({ message: 'Payment validated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error validating payment:', error);
    res.status(500).json({ message: 'Error validating payment' });
  } finally {
    connection.release();
  }
});

// Delete payment
router.delete('/:id', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const paymentId = req.params.id;

    await connection.beginTransaction();

    // Get payment and booking details
    const [payment] = await connection.query(
      `SELECT p.*, m.sellerId, m.title as motorName
       FROM payments p
       JOIN bookings b ON p.bookingId = b.id
       JOIN motors m ON b.motorId = m.id
       WHERE p.id = ?`,
      [paymentId]
    );

    if (!payment.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify user is the seller
    if (payment[0].sellerId !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ message: 'Not authorized to delete this payment' });
    }

    // Delete payment
    await connection.query('DELETE FROM payments WHERE id = ?', [paymentId]);

    await connection.commit();
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting payment:', error);
    res.status(500).json({ message: 'Error deleting payment' });
  } finally {
    connection.release();
  }
});


module.exports = router;
