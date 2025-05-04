const db = require('./config/db');
const { sendSubscriptionEmail } = require('./utils/emailService');

async function checkExpiredSubscriptions() {
  try {
    // Get subscriptions that are about to expire
    const [subscriptions] = await db.query(`
      SELECT s.*, u.email, p.name as plan_name, p.price, p.duration_months, p.max_listings
      FROM seller_subscriptions s
      JOIN users u ON s.seller_id = u.id
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.status = 'active' 
      AND (
        (s.is_trial = true AND s.trial_ends_at <= CURRENT_TIMESTAMP)
        OR 
        (s.is_trial = false AND s.end_date <= CURRENT_TIMESTAMP)
      )
    `);

    for (const subscription of subscriptions) {
      // Update subscription status
      await db.query(
        `UPDATE seller_subscriptions 
         SET status = 'expired',
             is_trial_used = CASE 
               WHEN is_trial = true OR status = 'expired' THEN 1 
               ELSE is_trial_used 
             END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [subscription.id]
      );

      // Insert notification
      await db.query(
        `INSERT INTO notifications (userId, type, content, created_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          subscription.seller_id,
          'subscription_expired',
          JSON.stringify({
            subscription_id: subscription.id,
            plan_name: subscription.plan_name,
            price: subscription.price,
            duration: subscription.duration_months === 1 ? '1 month' : `${subscription.duration_months} months`,
            max_listings: subscription.max_listings,
            expired_at: new Date()
          })
        ]
      );

      // Send email notification
      await sendSubscriptionEmail(subscription.email, {
        type: 'expired',
        planName: subscription.plan_name,
        price: subscription.price,
        duration: subscription.duration_months === 1 ? '1 month' : `${subscription.duration_months} months`,
        maxListings: subscription.max_listings
      });

      console.log(`Subscription ${subscription.id} expired and notification sent to ${subscription.email}`);
    }
  } catch (error) {
    console.error('Error checking expired subscriptions:', error);
  }
}

// Run immediately and then every minute
checkExpiredSubscriptions();
setInterval(checkExpiredSubscriptions, 60000);
