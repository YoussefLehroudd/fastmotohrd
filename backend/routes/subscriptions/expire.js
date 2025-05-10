const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { sendSubscriptionEmail } = require('../../utils/emailService');
const { getIO } = require('../../utils/socketService');

// Function to expire a subscription
async function expireSubscription(id) {
  console.log(`[Subscription Expire] Starting expiration process for subscription ${id}`);

  try {
    await db.query('START TRANSACTION');

    // Get subscription details with plan info
    const [subscription] = await db.query(
      `SELECT s.*, u.email, p.name as plan_name, p.price, p.duration_months, p.max_listings
       FROM seller_subscriptions s
       JOIN users u ON s.seller_id = u.id
       JOIN subscription_plans p ON s.plan_id = p.id
       WHERE s.id = ?`,
      [id]
    );

    if (!subscription[0]) {
      throw new Error('Subscription not found');
    }

    // Update subscription status
    await db.query(
      `UPDATE seller_subscriptions 
       SET status = 'expired',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );

    // Set all motors to not available
    await db.query(
      `UPDATE motors 
       SET isActive = false
       WHERE sellerId = ?`,
      [subscription[0].seller_id]
    );

    // Check if notification already exists for today
    const [existingNotification] = await db.query(
      `SELECT id FROM notifications 
       WHERE userId = ? 
       AND type = 'subscription_expired'
       AND DATE(created_at) = CURRENT_DATE`,
      [subscription[0].seller_id]
    );

    // Only create notification if one doesn't exist for today
    if (!existingNotification.length) {
      // Create notification
      await db.query(
        `INSERT INTO notifications (userId, type, content, priority)
         VALUES (?, 'subscription_expired', ?, 'high')`,
        [
          subscription[0].seller_id,
          `Your ${subscription[0].plan_name} subscription has expired. Please renew to continue using all features.`
        ]
      );

      // Create subscription event
      await db.query(
        `INSERT INTO subscription_events (seller_id, event_type, data, processed, event_date)
         VALUES (?, 'SUBSCRIPTION_EXPIRED', ?, false, NOW())`,
        [
          subscription[0].seller_id,
          JSON.stringify({
            email: subscription[0].email,
            type: 'expired',
            plan_name: subscription[0].plan_name,
            price: subscription[0].price,
            duration: subscription[0].duration_months === 1 
              ? '1 month' 
              : `${subscription[0].duration_months} months`,
            max_listings: subscription[0].max_listings,
            end_date: subscription[0].end_date
          })
        ]
      );
    }

    await db.query('COMMIT');

    // Emit socket event
    const io = getIO();
    io.to(`seller_${subscription[0].seller_id}`).emit('subscription_update', {
      type: 'expired',
      subscription: subscription[0]
    });

    console.log(`Subscription ${id} expired successfully`);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error expiring subscription:', error);
  }
}

// Check for expired subscriptions every second
async function checkExpiredSubscriptions() {
  try {
    // Get subscriptions that are expired but still active
    const [subscriptions] = await db.query(`
      SELECT s.id
      FROM seller_subscriptions s
      WHERE s.status = 'active' 
      AND (
        (s.is_trial = true AND s.trial_ends_at <= CURRENT_TIMESTAMP)
        OR 
        (s.is_trial = false AND s.end_date <= CURRENT_TIMESTAMP)
      )
    `);

    for (const subscription of subscriptions) {
      await expireSubscription(subscription.id);
    }
  } catch (error) {
    console.error('Error checking expired subscriptions:', error);
  }
}

// Start checking expired subscriptions
setInterval(checkExpiredSubscriptions, 1000);

// Handle subscription expiry
router.post('/:id/expire', async (req, res) => {
  const { id } = req.params;
  console.log(`[Subscription Expire] Starting expiration process for subscription ${id}`);

  try {
    console.log('[Subscription Expire] Beginning transaction');
    await db.query('START TRANSACTION');

    try {
      // Get subscription details with plan info
      const [subscription] = await db.query(
        `SELECT s.*, u.email, p.name as plan_name, p.price, p.duration_months, p.max_listings
         FROM seller_subscriptions s
         JOIN users u ON s.seller_id = u.id
         JOIN subscription_plans p ON s.plan_id = p.id
         WHERE s.id = ?`,
        [id]
      );

      if (!subscription[0]) {
        throw new Error('Subscription not found');
      }

      // Update subscription status
      await db.query(
        `UPDATE seller_subscriptions 
         SET status = 'expired',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id]
      );

      // Set all motors to not available
      await db.query(
        `UPDATE motors 
         SET isActive = false
         WHERE sellerId = ?`,
        [subscription[0].seller_id]
      );

      // Check if notification already exists for today
      const [existingNotification] = await db.query(
        `SELECT id FROM notifications 
         WHERE userId = ? 
         AND type = 'subscription_expired'
         AND DATE(created_at) = CURRENT_DATE`,
        [subscription[0].seller_id]
      );

      // Only create notification if one doesn't exist for today
      if (!existingNotification.length) {
        // Create notification
        await db.query(
          `INSERT INTO notifications (userId, type, content, priority)
           VALUES (?, 'subscription_expired', ?, 'high')`,
          [
            subscription[0].seller_id,
            `Your ${subscription[0].plan_name} subscription has expired. Please renew to continue using all features.`
          ]
        );

        // Create subscription event
        await db.query(
          `INSERT INTO subscription_events (seller_id, event_type, data, processed, event_date)
           VALUES (?, 'SUBSCRIPTION_EXPIRED', ?, false, NOW())`,
          [
            subscription[0].seller_id,
            JSON.stringify({
              email: subscription[0].email,
              type: 'expired',
              plan_name: subscription[0].plan_name,
              price: subscription[0].price,
              duration: subscription[0].duration_months === 1 
                ? '1 month' 
                : `${subscription[0].duration_months} months`,
              max_listings: subscription[0].max_listings,
              end_date: subscription[0].end_date
            })
          ]
        );
      }

      console.log('[Subscription Expire] Committing transaction');
      await db.query('COMMIT');
      console.log('[Subscription Expire] Transaction committed successfully');

      // Emit socket event
      const io = getIO();
      io.to(`seller_${subscription[0].seller_id}`).emit('subscription_update', {
        type: 'expired',
        subscription: subscription[0]
      });

      res.json({ message: 'Subscription expired successfully' });
    } catch (error) {
      console.error('[Subscription Expire] Error in transaction:', error);
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('[Subscription Expire] Error expiring subscription:', error);
    res.status(500).json({ message: 'Error expiring subscription', error: error.message });
  }
});

module.exports = router;
