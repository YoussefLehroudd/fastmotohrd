const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const { sendBookingCancellationEmail, sendBookingStatusEmail, sendNewBookingEmail } = require('../utils/emailService');

// ... (keep all other routes the same) ...

// Delete booking
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const bookingId = req.params.id;

    // Get booking details before deletion
    const [booking] = await db.query(
      `SELECT b.*, m.sellerId, m.title as motorName,
              u.email as userEmail, seller.email as sellerEmail
       FROM bookings b
       JOIN motors m ON b.motorId = m.id
       JOIN users u ON b.userId = u.id
       JOIN users seller ON m.sellerId = seller.id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (!booking.length) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Allow both user who made the booking and seller to delete
    if (booking[0].userId !== req.user.id && booking[0].sellerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this booking' });
    }

    // Delete related records first
    await db.query('DELETE FROM payments WHERE bookingId = ?', [bookingId]);
    await db.query('DELETE FROM notifications WHERE actionUrl LIKE ?', [`%${bookingId}%`]);
    // Then delete the booking
    await db.query('DELETE FROM bookings WHERE id = ?', [bookingId]);
    
    res.json({ message: 'Booking removed from orders' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Error deleting booking' });
  }
});

// ... (keep all other routes the same) ...

module.exports = router;
