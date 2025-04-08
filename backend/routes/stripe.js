const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');

// Create checkout session
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { bookingId, totalPrice, motorTitle } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mad',
            product_data: {
              name: `Booking for ${motorTitle}`,
              description: `Booking ID: ${bookingId}`
            },
            unit_amount: Math.round(totalPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?tab=bookings&payment=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?tab=bookings&payment=cancelled`,
      metadata: {
        bookingId: bookingId.toString()
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Error processing payment' });
  } finally {
    connection.release();
  }
});

// Webhook handler for successful payments
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const connection = await db.getConnection();
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const bookingId = session.metadata.bookingId;

      // Update payment record after successful payment
      await connection.query(
        `UPDATE payments 
         SET paymentMethod = 'stripe',
             status = 'pending'
         WHERE bookingId = ?`,
        [bookingId]
      );

      // Create notification for seller
      await connection.query(
        `INSERT INTO notifications (userId, content, type, actionUrl, priority)
         SELECT sellerId, ?, 'payment', ?, 'high'
         FROM motors m
         JOIN bookings b ON b.motorId = m.id
         WHERE b.id = ?`,
        [
          'New payment received! Please validate the payment to confirm the booking.',
          `/seller/payments`,
          bookingId
        ]
      );
    }

    res.json({received: true});
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ message: 'Error processing webhook' });
  } finally {
    connection.release();
  }
});

module.exports = router;
