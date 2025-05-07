const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { authenticateAdmin } = require('../../middleware/auth');
const { getIO } = require('../../utils/socketService');

// Get all subscription requests
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const [subscriptions] = await db.query(`
      SELECT 
        ss.*,
        u.username as seller_name,
        u.email as seller_email,
        sp.name as plan_name,
        sp.price,
        sp.duration_months,
        sp.max_listings,
        CASE 
          WHEN ss.is_trial = true THEN 'Trial'
          ELSE sp.name
        END as display_plan_name,
        (
          SELECT COUNT(*) 
          FROM seller_subscriptions 
          WHERE seller_id = ss.seller_id 
          AND is_trial = true 
          AND is_trial_used = true
        ) as has_used_trial
      FROM seller_subscriptions ss
      JOIN users u ON ss.seller_id = u.id
      JOIN subscription_plans sp ON ss.plan_id = sp.id
      ORDER BY 
        CASE 
          WHEN ss.status = 'pending' THEN 0
          WHEN ss.status = 'active' THEN 1
          ELSE 2
        END,
        ss.created_at DESC
    `);

    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Error fetching subscriptions', error: error.message });
  }
});

// Approve subscription request
router.post('/:id/approve', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get subscription details
    const [subscription] = await db.query(
      'SELECT * FROM seller_subscriptions WHERE id = ?',
      [id]
    );

    if (!subscription[0]) {
      throw new Error('Subscription not found');
    }

    // Get plan details
    const [plan] = await db.query(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [subscription[0].plan_id]
    );

    if (!plan[0]) {
      throw new Error('Plan not found');
    }

    // Calculate end date for non-unlimited plans
    let endDate = null;
    if (plan[0].duration_months > 0) {
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan[0].duration_months);
    }

    // Start a transaction
    await db.query('START TRANSACTION');

    try {
      // Get current active subscription if exists
      const [currentSub] = await db.query(
        `SELECT s.*, p.max_listings as current_max_listings, p.name as current_plan_name
         FROM seller_subscriptions s
         JOIN subscription_plans p ON s.plan_id = p.id
         WHERE s.seller_id = ? AND s.status = 'active'`,
        [subscription[0].seller_id]
      );

      // Get count of seller's active motors
      const [motorCount] = await db.query(
        `SELECT COUNT(*) as count 
         FROM motors 
         WHERE sellerId = ? 
         AND status != 'deleted'`,
        [subscription[0].seller_id]
      );

      // Check if motor count exceeds plan limit
      if (plan[0].max_listings !== null && motorCount[0].count > plan[0].max_listings) {
        const excessMotors = motorCount[0].count - plan[0].max_listings;
        throw new Error(
          `Cannot approve subscription to ${plan[0].name} plan: ` +
          `Seller has ${motorCount[0].count} existing motors. ` +
          `Please remove ${excessMotors} motor${excessMotors > 1 ? 's' : ''} to match the plan limit of ${plan[0].max_listings} motors.`
        );
      }

      const now = new Date();

      // If there's an active subscription (including trial), expire it
      if (currentSub.length > 0) {
        await db.query(
          `UPDATE seller_subscriptions 
           SET status = 'expired',
               end_date = ?,
               updated_at = ?,
               is_trial_used = CASE WHEN is_trial = true THEN true ELSE is_trial_used END
           WHERE id = ?`,
          [now, now, currentSub[0].id]
        );
      }

      // Get current motor count for this seller
      const [currentMotors] = await db.query(
        `SELECT COUNT(*) as count 
         FROM motors 
         WHERE sellerId = ? 
         AND status != 'deleted'`,
        [subscription[0].seller_id]
      );

      // Update new subscription status with current motor count
      await db.query(
        `UPDATE seller_subscriptions 
         SET status = 'active',
             start_date = CURRENT_TIMESTAMP,
             end_date = ?,
             updated_at = CURRENT_TIMESTAMP,
             is_trial = false,
             is_trial_used = false,
             listings_used = ?
         WHERE id = ?`,
        [endDate, currentMotors[0].count, id]
      );

      // Get seller's email
      const [seller] = await db.query(
        'SELECT u.email FROM users u WHERE u.id = ?',
        [subscription[0].seller_id]
      );

      // Send email notification
      const { sendSubscriptionEmail } = require('../../utils/emailService');
      await sendSubscriptionEmail(seller[0].email, {
        type: 'approved',
        planName: plan[0].name,
        price: plan[0].price,
        duration: plan[0].duration_months === 1 ? '1 month' : `${plan[0].duration_months} months`,
        maxListings: plan[0].max_listings
      });

      // Create notification for the seller
      const notificationMessage = `Your ${plan[0].name} subscription has been approved. You can list up to ${plan[0].max_listings || 'unlimited'} motors.`;
      await db.query(
        `INSERT INTO notifications (userId, type, content, priority) 
         VALUES (?, 'subscription_approved', ?, 'high')`,
        [subscription[0].seller_id, notificationMessage]
      );

      // Commit the transaction
      await db.query('COMMIT');
    } catch (error) {
      // Rollback on error
      await db.query('ROLLBACK');
      throw error;
    }

    // Get updated subscription details
    const [updatedSubscription] = await db.query(
      'SELECT s.*, p.name as plan_name FROM seller_subscriptions s JOIN subscription_plans p ON s.plan_id = p.id WHERE s.id = ?',
      [id]
    );

    // Emit socket event to notify seller
    const io = getIO();
    io.to(`seller_${subscription[0].seller_id}`).emit('subscription_update', {
      type: 'approved',
      subscription: {
        ...updatedSubscription[0],
        end_date: endDate
      }
    });

    res.json({ message: 'Subscription approved successfully' });
  } catch (error) {
    console.error('Error approving subscription:', error);
    res.status(500).json({ message: 'Error approving subscription', error: error.message });
  }
});

// Reject subscription request
router.post('/:id/reject', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Get subscription details first
      const [subscription] = await db.query(
        'SELECT * FROM seller_subscriptions WHERE id = ?',
        [id]
      );

      if (!subscription[0]) {
        throw new Error('Subscription not found');
      }

      await db.query(
        `UPDATE seller_subscriptions 
         SET status = 'rejected',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id]
      );

      // Create notification for the seller
      await db.query(
        `INSERT INTO notifications (userId, type, content, priority) 
         VALUES (?, 'subscription_rejected', ?, 'high')`,
        [subscription[0].seller_id, 'Your subscription request has been rejected.']
      );

      await db.query('COMMIT');

      // Get updated subscription details
      const [updatedSubscription] = await db.query(
        'SELECT s.*, p.name as plan_name FROM seller_subscriptions s JOIN subscription_plans p ON s.plan_id = p.id WHERE s.id = ?',
        [id]
      );

      // Emit socket event to notify seller
      const io = getIO();
      io.to(`seller_${subscription[0].seller_id}`).emit('subscription_update', {
        type: 'rejected',
        subscription: updatedSubscription[0]
      });

      res.json({ message: 'Subscription rejected successfully' });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error rejecting subscription:', error);
    res.status(500).json({ message: 'Error rejecting subscription', error: error.message });
  }
});

// Cancel subscription
router.post('/:id/cancel', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Get subscription details first
      const [subscription] = await db.query(
        'SELECT * FROM seller_subscriptions WHERE id = ?',
        [id]
      );

      if (!subscription[0]) {
        throw new Error('Subscription not found');
      }

      await db.query(
        `UPDATE seller_subscriptions 
         SET status = 'cancelled',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id]
      );

      // Create notification for the seller
      await db.query(
        `INSERT INTO notifications (userId, type, content, priority) 
         VALUES (?, 'subscription_cancelled', ?, 'high')`,
        [subscription[0].seller_id, 'Your subscription has been cancelled.']
      );

      await db.query('COMMIT');

      // Get updated subscription details
      const [updatedSubscription] = await db.query(
        'SELECT s.*, p.name as plan_name FROM seller_subscriptions s JOIN subscription_plans p ON s.plan_id = p.id WHERE s.id = ?',
        [id]
      );

      // Emit socket event to notify seller
      const io = getIO();
      io.to(`seller_${subscription[0].seller_id}`).emit('subscription_update', {
        type: 'cancelled',
        subscription: updatedSubscription[0]
      });

      res.json({ message: 'Subscription cancelled successfully' });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ message: 'Error cancelling subscription', error: error.message });
  }
});

// Delete subscription
router.delete('/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Get subscription details first
      const [subscription] = await db.query(
        'SELECT * FROM seller_subscriptions WHERE id = ?',
        [id]
      );

      if (!subscription[0]) {
        throw new Error('Subscription not found');
      }


      // Delete notifications related to this subscription
      await db.query(
        `DELETE FROM notifications 
         WHERE type = 'subscription_expired' 
         AND JSON_EXTRACT(content, '$.subscription_id') = ?`,
        [id]
      );

      // Finally delete the subscription
      await db.query(
        'DELETE FROM seller_subscriptions WHERE id = ?',
        [id]
      );

      await db.query('COMMIT');

      // Only emit socket event to notify seller (no email)
      const io = getIO();
      io.to(`seller_${subscription[0].seller_id}`).emit('subscription_update', {
        type: 'deleted',
        subscriptionId: id
      });

      res.json({ message: 'Subscription deleted successfully' });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ message: 'Error deleting subscription', error: error.message });
  }
});

module.exports = router;
