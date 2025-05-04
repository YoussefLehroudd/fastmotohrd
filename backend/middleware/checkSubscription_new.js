const db = require('../config/db');

const checkSubscription = async (req, res, next) => {
  if (req.user.role !== 'seller') {
    return next();
  }

  try {
    // Check current subscription
    const [subscriptions] = await db.query(`
      SELECT s.*, p.max_listings, p.name as plan_name,
        CASE
          WHEN s.status = 'expired' OR 
               (s.is_trial = true AND s.trial_ends_at <= CURRENT_TIMESTAMP) OR
               (s.is_trial = false AND s.end_date <= CURRENT_TIMESTAMP) 
          THEN 'expired'
          ELSE s.status
        END as current_status
      FROM seller_subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.seller_id = ? 
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [req.user.id]);

    // If no subscription at all
    if (subscriptions.length === 0) {
      return res.status(403).json({ 
        message: 'Active subscription required. Please subscribe to add motors.',
        requiresSubscription: true
      });
    }

    const subscription = subscriptions[0];

    // Check if subscription is expired
    if (subscription.current_status === 'expired') {
      return res.status(403).json({ 
        message: `Your ${subscription.plan_name} subscription has expired. Please renew to continue adding motors.`,
        requiresSubscription: true
      });
    }

    // Check if subscription is pending
    if (subscription.current_status === 'pending') {
      return res.status(403).json({ 
        message: 'Your subscription is pending approval. Please wait for admin approval.',
        requiresSubscription: true
      });
    }

    // Check listing limits for active subscription
    if (subscription.max_listings !== null && subscription.listings_used >= subscription.max_listings) {
      return res.status(403).json({ 
        message: 'Listing limit reached for your current plan. Please upgrade to add more motors.',
        requiresSubscription: true
      });
    }

    next();
  } catch (error) {
    console.error('Error checking subscription:', error);
    res.status(500).json({ message: 'Error checking subscription status' });
  }
};

module.exports = checkSubscription;
