const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// Get payment by booking ID
router.get('/booking/:id', verifyToken, async (req, res) => {
  try {
    const [payment] = await db.query(
      `SELECT p.*, b.status as booking_status
       FROM payments p
       JOIN bookings b ON p.bookingId = b.id
       JOIN motors m ON b.motorId = m.id
       WHERE p.bookingId = ? AND (b.userId = ? OR m.sellerId = ?)`,
      [req.params.id, req.user.id, req.user.id]
    );

    if (!payment.length) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment[0]);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Error fetching payment' });
  }
});

// Get all payments with stats for seller
router.get('/', verifyToken, async (req, res) => {
  try {
    // Get all payments with detailed information
    const [paymentsResult] = await db.query(
      `SELECT 
        p.*,
        b.startDate,
        b.endDate,
        b.status as booking_status,
        m.title as motor_name,
        m.brand as motor_brand,
        m.model as motor_model,
        u.username as customer_name,
        u.email as customer_email,
        validator.username as validated_by_name
       FROM payments p
       JOIN bookings b ON p.bookingId = b.id
       JOIN motors m ON b.motorId = m.id
       JOIN users u ON b.userId = u.id
       LEFT JOIN users validator ON p.validatedBy = validator.id
       WHERE m.sellerId = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    // Get payment stats
    const [statsResult] = await db.query(
      `SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'validated' THEN 1 END) as validated_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        CAST(COALESCE(SUM(CASE WHEN status = 'validated' THEN amount ELSE 0 END), 0) AS DECIMAL(10,2)) as total_validated,
        CAST(COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS DECIMAL(10,2)) as total_pending
       FROM payments p
       JOIN bookings b ON p.bookingId = b.id
       JOIN motors m ON b.motorId = m.id
       WHERE m.sellerId = ?`,
      [req.user.id]
    );

    // Format the response
    const formattedPayments = paymentsResult.map(payment => ({
      id: payment.id,
      bookingId: payment.bookingId,
      motorName: payment.motor_name,
      motorDetails: `${payment.motor_brand || ''} ${payment.motor_model || ''}`.trim() || 'N/A',
      customerName: payment.customer_name,
      customerEmail: payment.customer_email,
      amount: parseFloat(payment.amount || 0).toFixed(2),
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      proofUrl: payment.proofUrl,
      validatedBy: payment.validated_by_name,
      validatedAt: payment.validatedAt,
      notes: payment.notes,
      booking: {
        startDate: payment.startDate,
        endDate: payment.endDate,
        status: payment.booking_status
      },
      created_at: payment.created_at
    }));

    res.json({
      transactions: formattedPayments,
      stats: {
        pending_count: statsResult[0].pending_count || 0,
        validated_count: statsResult[0].validated_count || 0,
        rejected_count: statsResult[0].rejected_count || 0,
        total_validated: parseFloat(statsResult[0].total_validated || 0).toFixed(2),
        total_pending: parseFloat(statsResult[0].total_pending || 0).toFixed(2)
      }
    });
  } catch (err) {
    console.error('Error in /payments:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Validate payment
router.post('/:id/validate', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Verify payment belongs to seller
    const [payment] = await connection.query(
      `SELECT p.*, b.status as booking_status, b.userId 
       FROM payments p
       JOIN bookings b ON p.bookingId = b.id
       JOIN motors m ON b.motorId = m.id
       WHERE p.id = ? AND m.sellerId = ?`,
      [id, req.user.id]
    );

    if (payment.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment[0].status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ error: 'Payment cannot be validated - invalid status' });
    }

    // Update payment status
    await connection.query(
      `UPDATE payments 
       SET status = 'validated',
           validatedBy = ?,
           validatedAt = CURRENT_TIMESTAMP,
           notes = ?
       WHERE id = ?`,
      [req.user.id, notes || null, id]
    );

    // Update booking status to confirmed when payment is validated
    await connection.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      ['confirmed', payment[0].bookingId]
    );

    // Create notification for customer
    await connection.query(
      `INSERT INTO notifications (userId, content, type, actionUrl, priority) 
       VALUES (?, ?, 'payment', ?, 'high')`,
      [
        payment[0].userId,
        `Your payment of ${payment[0].amount} has been validated`,
        `/bookings/${payment[0].bookingId}`
      ]
    );

    await connection.commit();
    res.json({ message: 'Payment validated successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Error validating payment:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    connection.release();
  }
});

// Reject payment
router.post('/:id/reject', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Verify payment belongs to seller
    const [payment] = await connection.query(
      `SELECT p.*, b.userId 
       FROM payments p
       JOIN bookings b ON p.bookingId = b.id
       JOIN motors m ON b.motorId = m.id
       WHERE p.id = ? AND m.sellerId = ?`,
      [id, req.user.id]
    );

    if (payment.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment[0].status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ error: 'Payment cannot be rejected - invalid status' });
    }

    // Update payment status
    await connection.query(
      `UPDATE payments 
       SET status = 'rejected',
           notes = ?
       WHERE id = ?`,
      [notes || 'Payment rejected by seller', id]
    );

    // Create notification for customer
    await connection.query(
      `INSERT INTO notifications (userId, content, type, actionUrl, priority) 
       VALUES (?, ?, 'payment', ?, 'high')`,
      [
        payment[0].userId,
        `Your payment of ${payment[0].amount} has been rejected${notes ? ': ' + notes : ''}`,
        `/bookings/${payment[0].bookingId}`
      ]
    );

    await connection.commit();
    res.json({ message: 'Payment rejected successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Error rejecting payment:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    connection.release();
  }
});

module.exports = router;
