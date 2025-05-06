const db = require('../config/db');

async function up() {
  try {
    // Drop all existing subscription-related events
    await db.query('DROP EVENT IF EXISTS check_expired_subscriptions');
    await db.query('DROP EVENT IF EXISTS check_subscription_expiry');
    await db.query('DROP EVENT IF EXISTS update_expired_subscriptions');

    // Create single consolidated event
    await db.query(`
      CREATE EVENT check_subscription_expiry
      ON SCHEDULE EVERY 1 MINUTE
      DO
      BEGIN
        -- Update expired subscriptions
        UPDATE seller_subscriptions s1
        SET status = 'expired'
        WHERE s1.status = 'active'
        AND (
          (s1.end_date IS NOT NULL AND s1.end_date <= CURRENT_TIMESTAMP)
          OR 
          (s1.is_trial = true AND s1.trial_ends_at <= CURRENT_TIMESTAMP)
        )
        AND NOT EXISTS (
          SELECT 1 
          FROM seller_subscriptions s2 
          WHERE s2.seller_id = s1.seller_id 
          AND s2.id > s1.id 
          AND s2.status = 'active'
        );

        -- Insert notifications for newly expired subscriptions
        INSERT INTO notifications (userId, type, content, created_at)
        SELECT DISTINCT
          s.seller_id,
          'subscription_expired',
          CONCAT('Your ', p.name, ' subscription has expired. Please renew to continue using all features.'),
          CURRENT_TIMESTAMP
        FROM seller_subscriptions s
        JOIN subscription_plans p ON s.plan_id = p.id
        WHERE s.status = 'expired'
        AND NOT EXISTS (
          SELECT 1 
          FROM notifications n
          WHERE n.userId = s.seller_id
          AND n.type = 'subscription_expired'
          AND n.created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 MINUTE)
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

    console.log('Subscription events consolidated successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function down() {
  try {
    await db.query('DROP EVENT IF EXISTS check_subscription_expiry');
    console.log('Consolidated subscription event dropped successfully');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  }
}

module.exports = { up, down };
