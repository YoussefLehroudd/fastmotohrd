const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

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
    const [subscriptions] = await db.query(`
      SELECT s.*, p.name as plan_name, p.max_listings, p.duration_months, p.price
      FROM seller_subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.seller_id = ? AND s.status = 'active'
      AND (s.end_date IS NULL OR s.end_date > CURRENT_TIMESTAMP)
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [req.user.id]);

    // Check if seller is in trial period
    const [trialSubscription] = await db.query(`
      SELECT * FROM seller_subscriptions
      WHERE seller_id = ? AND is_trial = true
      AND trial_ends_at > CURRENT_TIMESTAMP
      LIMIT 1
    `, [req.user.id]);

    if (trialSubscription.length > 0) {
      res.json({
        ...trialSubscription[0],
        plan_name: 'Free Trial',
        max_listings: 1,
        duration_months: 0,
        price: 0,
        is_trial: true
      });
    } else if (subscriptions.length > 0) {
      res.json(subscriptions[0]);
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
    // Check if user already had a trial
    const [existingTrial] = await db.query(
      'SELECT * FROM seller_subscriptions WHERE seller_id = ? AND is_trial = true',
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
      (seller_id, plan_id, status, is_trial, trial_ends_at, end_date) 
      VALUES (?, 1, 'active', true, ?, ?)`,
      [req.user.id, trialEndDate, trialEndDate]
    );

    res.json({ message: 'Free trial started successfully' });
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
    // Check if plan exists
    const [plans] = await db.query(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [planId]
    );

    if (plans.length === 0) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    // Create subscription request
    await db.query(`
      INSERT INTO seller_subscriptions 
      (seller_id, plan_id, status) 
      VALUES (?, ?, 'pending')`,
      [req.user.id, planId]
    );

    // Get plan details and bank details for the response
    const plan = plans[0];
    const [bankDetails] = await db.query('SELECT * FROM bank_details ORDER BY id DESC LIMIT 1');
    
    if (bankDetails.length === 0) {
      return res.status(500).json({ message: 'Bank details not configured' });
    }

    res.json({ 
      message: 'Subscription request submitted successfully',
      paymentDetails: {
        amount: plan.price,
        bankName: bankDetails[0].bank_name,
        accountNumber: bankDetails[0].account_number,
        beneficiary: bankDetails[0].beneficiary,
        instructions: `Please send the payment receipt to our WhatsApp number: ${bankDetails[0].whatsapp_number}`
      }
    });
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

    // Update subscription status
    await db.query(`
      UPDATE seller_subscriptions 
      SET status = 'active', end_date = ?
      WHERE id = ?`,
      [endDate, req.params.subscriptionId]
    );

    res.json({ message: 'Subscription approved successfully' });
  } catch (error) {
    console.error('Error approving subscription:', error);
    res.status(500).json({ message: 'Failed to approve subscription' });
  }
});

module.exports = router;
