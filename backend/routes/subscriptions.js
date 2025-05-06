const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get trial status
router.get('/trial-status', verifyToken, async (req, res) => {
  try {
    const [trialStatus] = await db.query(
      'SELECT COUNT(*) as count FROM seller_subscriptions WHERE seller_id = ? AND is_trial_used = true',
      [req.user.id]
    );
    
    res.json({ trialUsed: trialStatus[0].count > 0 });
  } catch (error) {
    console.error('Error fetching trial status:', error);
    res.status(500).json({ message: 'Failed to fetch trial status' });
  }
});

// Get subscription plans
router.get('/plans', async (req, res) => {
  try {
    const [plans] = await db.query('SELECT * FROM subscription_plans');
    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ message: 'Failed to fetch subscription plans' });
  }
});

// Get seller's current subscription
router.get('/current', verifyToken, async (req, res) => {
  try {
    // Get the most recent subscription, whether active or expired
    const [subscription] = await db.query(`
      SELECT s.*, p.name as plan_name, p.max_listings, p.duration_months, p.price,
             CASE 
               WHEN s.is_trial = true THEN 'Free Trial'
               ELSE p.name
             END as display_name,
             CASE 
               WHEN s.is_trial = true THEN 1
               ELSE p.max_listings
             END as effective_max_listings,
             CASE
               WHEN s.status = 'rejected' THEN 'rejected'
               WHEN s.status = 'pending' THEN 'pending'
               WHEN s.status = 'expired' OR 
                    (s.is_trial = true AND s.trial_ends_at <= CURRENT_TIMESTAMP) OR
                    (s.is_trial = false AND s.end_date <= CURRENT_TIMESTAMP) THEN 'expired'
               ELSE 'active'
             END as current_status
      FROM seller_subscriptions s
      LEFT JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.seller_id = ?
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [req.user.id]);

    if (subscription.length > 0) {
      const sub = subscription[0];
      res.json({
        ...sub,
        plan_name: sub.display_name,
        max_listings: sub.effective_max_listings,
        duration_months: sub.is_trial ? 0 : sub.duration_months,
        price: sub.is_trial ? 0 : sub.price,
        status: sub.current_status // Use the calculated status
      });
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    res.status(500).json({ message: 'Failed to fetch current subscription' });
  }
});

// Start free trial
router.post('/start-trial', verifyToken, async (req, res) => {
  try {
    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Check for rejected subscription
      const [rejectedSub] = await db.query(
        `SELECT * FROM seller_subscriptions 
         WHERE seller_id = ? AND status = 'rejected'
         ORDER BY created_at DESC LIMIT 1`,
        [req.user.id]
      );

      if (rejectedSub.length > 0) {
        return res.status(403).json({ 
          message: 'Your previous subscription request was rejected. Please contact support for assistance.'
        });
      }

      // Check if user already had a trial
      const [existingTrial] = await db.query(
        'SELECT * FROM seller_subscriptions WHERE seller_id = ? AND is_trial_used = true',
        [req.user.id]
      );

      if (existingTrial.length > 0) {
        return res.status(400).json({ message: 'Free trial already used' });
      }

      // Create trial subscription
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days trial

      await db.query(`
        INSERT INTO seller_subscriptions 
        (seller_id, plan_id, status, is_trial, is_trial_used, trial_ends_at, end_date, created_at, updated_at) 
        VALUES (?, 1, 'active', true, true, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [req.user.id, trialEndDate, trialEndDate]
      );

      await db.query('COMMIT');
      res.json({ message: 'Free trial started successfully' });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error starting free trial:', error);
    res.status(500).json({ message: 'Failed to start free trial' });
  }
});

// Request subscription
router.post('/request', verifyToken, async (req, res) => {
  const { planId } = req.body;
  
  if (!planId) {
    return res.status(400).json({ message: 'Plan ID is required' });
  }

  try {
    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Get plan details and current subscription
      const [plans] = await db.query(
        'SELECT * FROM subscription_plans WHERE id = ?',
        [planId]
      );

      if (plans.length === 0) {
        throw new Error('Subscription plan not found');
      }

      const plan = plans[0];

      // Get current subscription with plan details
      const [currentSub] = await db.query(
        `SELECT s.*, p.max_listings as current_max_listings, p.name as current_plan_name
         FROM seller_subscriptions s
         JOIN subscription_plans p ON s.plan_id = p.id
         WHERE s.seller_id = ? AND s.status = 'active'`,
        [req.user.id]
      );

      // Get count of seller's active motors
      const [motorCount] = await db.query(
        `SELECT COUNT(*) as count 
         FROM motors 
         WHERE sellerId = ? 
         AND status != 'deleted'`,
        [req.user.id]
      );

      // Check if this is a downgrade (moving to a plan with fewer listings)
      const isDowngrade = currentSub.length > 0 && 
        (currentSub[0].current_max_listings === null || // Current plan is unlimited
         (plan.max_listings !== null && plan.max_listings < currentSub[0].current_max_listings));

      // If downgrading and have more motors than new plan allows, reject
      if (isDowngrade && plan.max_listings !== null && motorCount[0].count > plan.max_listings) {
        const excessMotors = motorCount[0].count - plan.max_listings;
        return res.status(400).json({
          message: `Cannot downgrade from ${currentSub[0].current_plan_name} to ${plan.name}: ` +
                  `You currently have ${motorCount[0].count} motors. ` +
                  `Please remove ${excessMotors} motor${excessMotors > 1 ? 's' : ''} before downgrading to a plan that only allows ${plan.max_listings} motors.`
        });
      }

      // Check for rejected subscription
      const [rejectedSub] = await db.query(
        `SELECT * FROM seller_subscriptions 
         WHERE seller_id = ? AND status = 'rejected'
         ORDER BY created_at DESC LIMIT 1`,
        [req.user.id]
      );

      if (rejectedSub.length > 0) {
        return res.status(403).json({ 
          message: 'Your previous subscription request was rejected. Please contact support for assistance.'
        });
      }

      const now = new Date();
      
      // Calculate end date based on plan duration
      const endDate = plan.duration_months > 0 
        ? new Date(now.getTime() + (plan.duration_months * 30 * 24 * 60 * 60 * 1000))
        : null;

      // Create new subscription in pending status
      const [result] = await db.query(
        `INSERT INTO seller_subscriptions 
         (seller_id, plan_id, status, start_date, end_date, created_at, updated_at, is_trial, is_trial_used)
         VALUES (?, ?, 'pending', ?, ?, ?, ?, false, false)`,
        [req.user.id, planId, now, endDate, now, now]
      );

      // After admin approves, they will expire the trial and activate this subscription

      // Get bank details for payment
      const [bankDetails] = await db.query('SELECT * FROM bank_details ORDER BY id DESC LIMIT 1');
      
      if (bankDetails.length === 0) {
        throw new Error('Bank details not configured');
      }

      // Get the new subscription details with all fields
      const [subscriptions] = await db.query(`
        SELECT s.*, p.name as plan_name, p.max_listings, p.duration_months, p.price,
               CASE 
                 WHEN s.is_trial = true THEN 'Free Trial'
                 ELSE p.name
               END as display_name,
               CASE 
                 WHEN s.is_trial = true THEN 1
                 ELSE p.max_listings
               END as effective_max_listings
        FROM seller_subscriptions s
        JOIN subscription_plans p ON s.plan_id = p.id
        WHERE s.id = ?
        LIMIT 1
      `, [result.insertId]);

      // Format subscription data like /current endpoint
      const subscription = subscriptions[0] ? {
        ...subscriptions[0],
        plan_name: subscriptions[0].display_name,
        max_listings: subscriptions[0].effective_max_listings,
        status: 'pending'  // Force pending status for new subscription
      } : null;

      // Commit transaction
      await db.query('COMMIT');

      // Get user's email
      const [user] = await db.query('SELECT email FROM users WHERE id = ?', [req.user.id]);

      // Send email notification about subscription request
      const { sendSubscriptionEmail } = require('../utils/emailService');
      await sendSubscriptionEmail(user[0].email, {
        type: 'requested',
        planName: plan.name,
        price: plan.price,
        duration: plan.duration_months === 1 ? '1 month' : `${plan.duration_months} months`,
        maxListings: plan.max_listings
      });


      // Emit socket event to notify admin about new subscription request
      const io = require('../utils/socketService').getIO();
      io.to('admin_room').emit('subscription_request', {
        type: 'pending',
        subscription: {
          id: result.insertId,
          plan: plan
        }
      });

      res.json({ 
        message: 'Subscription request submitted successfully. Please wait for admin approval.',
        subscription: subscription,
        paymentDetails: {
          amount: plan.price,
          bankName: bankDetails[0].bank_name,
          accountNumber: bankDetails[0].account_number,
          beneficiary: bankDetails[0].beneficiary,
          instructions: `Please send the payment receipt to our WhatsApp number: ${bankDetails[0].whatsapp_number}`
        }
      });
    } catch (error) {
      // Rollback on error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error requesting subscription:', error);
    res.status(500).json({ message: 'Failed to request subscription' });
  }
});

// Admin: Approve subscription
router.post('/:subscriptionId/approve', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    // Get subscription and plan details
    const [subscriptions] = await db.query(`
      SELECT s.*, p.duration_months 
      FROM seller_subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.id = ?`,
      [req.params.subscriptionId]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const subscription = subscriptions[0];
    const endDate = subscription.duration_months > 0 
      ? new Date(Date.now() + subscription.duration_months * 30 * 24 * 60 * 60 * 1000)
      : null;

    await db.query('START TRANSACTION');

    try {
      // Get the seller's current active subscription (if any)
      const [currentSub] = await db.query(
        `SELECT * FROM seller_subscriptions 
         WHERE seller_id = ? AND status = 'active'`,
        [subscription.seller_id]
      );

      const now = new Date();

      // If there's an active subscription, expire it
      if (currentSub.length > 0) {
        await db.query(
          `UPDATE seller_subscriptions 
           SET status = 'expired',
               end_date = ?,
               updated_at = ?,
               is_trial_used = CASE 
                 WHEN is_trial = true OR status = 'expired' THEN 1 
                 ELSE is_trial_used 
               END
           WHERE id = ?`,
          [now, now, currentSub[0].id]
        );
      }

      // Activate the pending subscription
      await db.query(`
        UPDATE seller_subscriptions 
        SET status = 'active',
            start_date = CURRENT_TIMESTAMP,
            end_date = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [endDate, req.params.subscriptionId]
      );

      // Get seller's email
      const [seller] = await db.query(
        'SELECT email FROM users WHERE id = ?',
        [subscription.seller_id]
      );

      // Emit socket event to notify seller
      const io = require('../utils/socketService').getIO();
      io.to(`seller_${subscription.seller_id}`).emit('subscription_update', {
        type: 'approved',
        subscription: {
          ...subscription,
          status: 'active',
          end_date: endDate
        }
      });

      // Get full subscription details
      const [subDetails] = await db.query(`
        SELECT s.*, p.name as plan_name, p.price, p.max_listings, p.duration_months
        FROM seller_subscriptions s
        JOIN subscription_plans p ON s.plan_id = p.id
        WHERE s.id = ?`,
        [req.params.subscriptionId]
      );

      // Send email notification
      const { sendSubscriptionEmail } = require('../utils/emailService');
      await sendSubscriptionEmail(seller[0].email, {
        type: 'approved',
        planName: subDetails[0].plan_name,
        price: subDetails[0].price,
        duration: subDetails[0].duration_months === 1 ? '1 month' : `${subDetails[0].duration_months} months`,
        maxListings: subDetails[0].max_listings,
        endDate: endDate
      });

      await db.query('COMMIT');
      res.json({ message: 'Subscription approved successfully' });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error approving subscription:', error);
    res.status(500).json({ message: 'Failed to approve subscription' });
  }
});

module.exports = router;
