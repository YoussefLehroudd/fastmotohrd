const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const { sendBookingCancellationEmail, sendBookingStatusEmail, sendNewBookingEmail } = require('../utils/emailService');

// Get all bookings for a user
router.get('/', verifyToken, async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.*, m.title as motorName, m.imageUrl, m.brand, m.model,
              u.username as customerName, seller.username as sellerName,
              b.location
       FROM bookings b
       JOIN motors m ON b.motorId = m.id
       JOIN users u ON b.userId = u.id
       JOIN users seller ON m.sellerId = seller.id
       WHERE b.userId = ? OR m.sellerId = ?
       ORDER BY b.created_at DESC`,
      [req.user.id, req.user.id]
    );
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Get a specific booking
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [booking] = await db.query(
      `SELECT b.*, m.id as motorId, m.title as motorName, m.imageUrl, m.brand, m.model,
              u.username as customerName, u.email as customerEmail, u.phone as customerPhone,
              seller.username as sellerName,
              ml.address, ml.city,
              p.paymentMethod, p.status as paymentStatus, p.notes as paymentNotes
       FROM bookings b
       JOIN motors m ON b.motorId = m.id
       JOIN users u ON b.userId = u.id
       JOIN users seller ON m.sellerId = seller.id
       LEFT JOIN motor_locations ml ON b.locationId = ml.id
       LEFT JOIN payments p ON b.id = p.bookingId
       WHERE b.id = ? AND (b.userId = ? OR m.sellerId = ?)`,
      [req.params.id, req.user.id, req.user.id]
    );

    if (!booking.length) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking[0]);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Error fetching booking' });
  }
});

// Create a new booking
router.post('/', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { 
      motorId, startDate, endDate, pickupTime, returnTime, 
      locationId, totalPrice, depositAmount, specialRequests 
    } = req.body;

    await connection.beginTransaction();

    // Check if motor exists and is available
    const [motor] = await connection.query(
      `SELECT m.*, seller.email as email 
       FROM motors m
       JOIN users seller ON m.sellerId = seller.id
       WHERE m.id = ? AND m.isAvailableForRent = true`,
      [motorId]
    );

    if (!motor.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Motor not found or not available for rent' });
    }

    // Check for confirmed booking conflicts
    const [conflicts] = await connection.query(
      `SELECT id FROM bookings 
       WHERE motorId = ? 
       AND status = 'confirmed'
       AND ((startDate BETWEEN ? AND ?) 
       OR (endDate BETWEEN ? AND ?)
       OR (? BETWEEN startDate AND endDate))`,
      [motorId, startDate, endDate, startDate, endDate, startDate]
    );

    if (conflicts.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Selected dates are not available' });
    }

    // Get user email and location details
    const [locationDetails] = await connection.query(
      `SELECT ml.city, ml.address
       FROM motor_locations ml
       WHERE ml.id = ?`,
      [locationId]
    );

    const [userDetails] = await connection.query(
      `SELECT u.email FROM users u WHERE u.id = ?`,
      [req.user.id]
    );

    const formattedLocation = locationDetails.length > 0 
      ? `${locationDetails[0].city.toLowerCase()}, ${locationDetails[0].address.toLowerCase()}`
      : locationId;

    // Create booking with location and default status
    const [result] = await connection.query(
      `INSERT INTO bookings (
        motorId, userId, startDate, endDate, pickupTime, returnTime,
        location, totalPrice, depositAmount, specialRequests, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        motorId, req.user.id, startDate, endDate, pickupTime, returnTime,
        formattedLocation, totalPrice, depositAmount, specialRequests
      ]
    );


    // Create initial payment record with selected payment method and default status
    const { paymentMethod } = req.body;
    const paymentStatus = paymentMethod === 'cash_on_delivery' ? 'pending' : 'awaiting_confirmation';
    await connection.query(
      `INSERT INTO payments (bookingId, amount, paymentMethod, status)
       VALUES (?, ?, ?, ?)`,
      [result.insertId, totalPrice, paymentMethod, paymentStatus]
    );

    // Send notifications
    await connection.query(
      `INSERT INTO notifications (userId, content, type, actionUrl, priority)
       VALUES (?, ?, 'booking', ?, 'high')`,
      [
        motor[0].sellerId,
        `New booking request for ${motor[0].title}`,
        `/bookings/${result.insertId}`
      ]
    );

    // Send email notifications to both seller and user
    const bookingDetails = {
      bookingId: result.insertId,
      motorName: motor[0].title,
      startDate,
      endDate,
      pickupTime,
      returnTime,
      location: formattedLocation,
      paymentMethod,
      paymentInfo: { 
        amount: totalPrice,
        status: paymentMethod === 'stripe' ? 'pending' : 'awaiting_confirmation'
      }
    };

    // Send to seller
    await sendNewBookingEmail(motor[0].email, {
      ...bookingDetails,
      isUser: false
    });

    // Send to user
    await sendNewBookingEmail(userDetails[0].email, {
      ...bookingDetails,
      isUser: true
    });

    await connection.commit();
    res.json({ 
      message: 'Booking created successfully',
      bookingId: result.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking' });
  } finally {
    connection.release();
  }
});

// Update booking status
router.patch('/:id/status', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { status, validatePayment } = req.body;
    const bookingId = req.params.id;

    await connection.beginTransaction();

    // If marking as completed and validatePayment is true, validate the payment
    if (status === 'completed' && validatePayment) {
      const [payment] = await connection.query(
        'SELECT id FROM payments WHERE bookingId = ?',
        [bookingId]
      );
      
      if (payment.length > 0) {
        await connection.query(
          'UPDATE payments SET status = ?, notes = ? WHERE id = ?',
          ['paid', 'Payment validated on order completion', payment[0].id]
        );
      }
    }

    // Get booking details with location
    const [booking] = await connection.query(
      `SELECT b.*, m.sellerId, m.title as motorName,
              u.email as userEmail, seller.email as sellerEmail,
              b.location
       FROM bookings b
       JOIN motors m ON b.motorId = m.id
       JOIN users u ON b.userId = u.id
       JOIN users seller ON m.sellerId = seller.id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (!booking.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify user is authorized (either the customer or seller)
    if (booking[0].userId !== req.user.id && booking[0].sellerId !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // Update booking status
    await connection.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, bookingId]
    );

    // Create notification
    await connection.query(
      `INSERT INTO notifications (userId, content, type, actionUrl, priority)
       VALUES (?, ?, 'booking', ?, 'high')`,
      [
        booking[0].userId,
        `Your booking for ${booking[0].motorName} has been ${status}`,
        `/bookings/${bookingId}`
      ]
    );

    // Send email notifications to both parties for status change
    // Get payment status
    const [payment] = await connection.query(
      'SELECT status FROM payments WHERE bookingId = ?',
      [bookingId]
    );

    const statusDetails = {
      bookingId,
      motorName: booking[0].motorName,
      status,
      startDate: booking[0].startDate,
      endDate: booking[0].endDate,
      pickupTime: booking[0].pickupTime,
      returnTime: booking[0].returnTime,
      location: booking[0].location ? booking[0].location.toLowerCase() : 'Location not specified',
      paymentMethod: payment[0]?.paymentMethod || 'cash_on_delivery',
      paymentInfo: { 
        amount: booking[0].totalPrice,
        status: payment[0]?.status || 'awaiting_confirmation'
      }
    };

    // Send to user
    await sendBookingStatusEmail(booking[0].userEmail, statusDetails);
    
    // Send to seller
    await sendBookingStatusEmail(booking[0].sellerEmail, statusDetails);

    await connection.commit();
    res.json({ message: 'Booking status updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Error updating booking status' });
  } finally {
    connection.release();
  }
});


// Get payment for a booking (redirect to payments route)
router.get('/:id/payment', verifyToken, async (req, res) => {
  res.redirect(307, `/api/payments/booking/${req.params.id}`);
});

// Delete booking
router.delete('/:id', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const bookingId = req.params.id;

    await connection.beginTransaction();

    // Get booking details with location before deletion
    const [booking] = await connection.query(
      `SELECT b.*, m.sellerId, m.title as motorName,
              u.email as userEmail, seller.email as sellerEmail,
              b.location
       FROM bookings b
       JOIN motors m ON b.motorId = m.id
       JOIN users u ON b.userId = u.id
       JOIN users seller ON m.sellerId = seller.id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (!booking.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Allow both user who made the booking and seller to delete
    if (booking[0].userId !== req.user.id && booking[0].sellerId !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ message: 'Not authorized to delete this booking' });
    }

    // Delete related records first
    await connection.query('DELETE FROM payments WHERE bookingId = ?', [bookingId]);
    await connection.query('DELETE FROM notifications WHERE actionUrl LIKE ?', [`%${bookingId}%`]);
    // Then delete the booking
    await connection.query('DELETE FROM bookings WHERE id = ?', [bookingId]);

    // Send cancellation email to both parties
    const cancellationDetails = {
      bookingId,
      motorName: booking[0].motorName,
      startDate: booking[0].startDate,
      endDate: booking[0].endDate,
      pickupTime: booking[0].pickupTime,
      returnTime: booking[0].returnTime,
      location: booking[0].location ? booking[0].location.toLowerCase() : 'Location not specified',
      reason: 'Booking cancelled'
    };

    // Send to user
    await sendBookingCancellationEmail(booking[0].userEmail, cancellationDetails);
    
    // Send to seller  
    await sendBookingCancellationEmail(booking[0].sellerEmail, cancellationDetails);

    await connection.commit();
    res.json({ message: 'Booking removed from orders' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Error deleting booking' });
  } finally {
    connection.release();
  }
});

module.exports = router;
