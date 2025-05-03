const db = require('../config/db');

const checkSubscription = async (req, res, next) => {
  if (req.user.role !== 'seller') {
    return next();
  }

  try {
    // Check current subscription
    const [subscriptions] = await db.query(`
      SELECT s.*, p.max_listings
      FROM seller_subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.seller_id = ? 
      AND s.status = 'active'
      AND (s.end_date IS NULL OR s.end_date > CURRENT_TIMESTAMP)
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [req.user.id]);

    // If no active subscription
    if (subscriptions.length === 0) {
      // Check if in trial period
      const [trial] = await db.query(`
        SELECT * FROM seller_subscriptions
        WHERE seller_id = ? AND is_trial = true
        AND trial_ends_at > CURRENT_TIMESTAMP
        LIMIT 1
      `, [req.user.id]);

      if (trial.length === 0) {
        return res.status(403).json({ 
          message: 'Active subscription required. Please subscribe to add more motors.',
          requiresSubscription: true
        });
      }

      // Check trial listing limit
      if (trial[0].listings_used >= 1) {
        return res.status(403).json({ 
          message: 'Trial listing limit reached. Please subscribe to add more motors.',
          requiresSubscription: true
        });
      }
    } else {
      // Check subscription listing limit
      const subscription = subscriptions[0];
      if (subscription.max_listings !== null && subscription.listings_used >= subscription.max_listings) {
        return res.status(403).json({ 
          message: 'Listing limit reached for your current plan. Please upgrade to add more motors.',
          requiresSubscription: true
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error checking subscription:', error);
    res.status(500).json({ message: 'Error checking subscription status' });
  }
};

module.exports = checkSubscription;
