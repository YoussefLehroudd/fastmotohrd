const db = require('../config/db');

async function up() {
  try {
    // Drop existing event
    await db.query('DROP EVENT IF EXISTS check_subscription_expiry');

    // Create updated event without duplicate socket emissions
    await db.query(`
      CREATE EVENT check_subscription_expiry
      ON SCHEDULE EVERY 1 MINUTE
      DO
      BEGIN
        -- Update expired subscriptions that don't have a newer active subscription and are not already expired
        UPDATE seller_subscriptions s1
        SET status = 'expired'
        WHERE (
          (status = 'active' AND end_date IS NOT NULL AND end_date <= CURRENT_TIMESTAMP)
          OR
          (status = 'active' AND is_trial = true AND trial_ends_at <= CURRENT_TIMESTAMP)
        )
        AND NOT EXISTS (
          SELECT 1 
          FROM seller_subscriptions s2 
          WHERE s2.seller_id = s1.seller_id 
          AND s2.id > s1.id 
          AND s2.status = 'active'
        )
        AND s1.status != 'expired';

        -- Insert notifications only for newly expired subscriptions without newer active ones
        INSERT INTO notifications (userId, type, content, created_at)
        SELECT 
          s.seller_id,
          'subscription_expired',
          CONCAT('Your subscription has expired. Please renew to continue using all features.'),
          CURRENT_TIMESTAMP
        FROM seller_subscriptions s
        JOIN subscription_plans p ON s.plan_id = p.id
        WHERE s.status = 'expired'
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.userId = s.seller_id 
          AND n.type = 'subscription_expired'
          AND n.content = CONCAT('Your subscription has expired. Please renew to continue using all features.')
        )
        AND NOT EXISTS (
          SELECT 1 
          FROM seller_subscriptions s2 
          WHERE s2.seller_id = s.seller_id 
          AND s2.id > s.id 
          AND s2.status = 'active'
        );
      END;
    `);

    console.log('Subscription notifications updated successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function down() {
  try {
    await db.query('DROP EVENT IF EXISTS check_subscription_expiry');
    console.log('Subscription event dropped successfully');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  }
}

module.exports = { up, down };
