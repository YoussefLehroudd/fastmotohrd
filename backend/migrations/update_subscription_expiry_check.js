const db = require('../config/db');

async function up() {
  try {
    // Enable event scheduler if not enabled
    await db.query('SET GLOBAL event_scheduler = ON');

    // Drop existing event if it exists
    await db.query('DROP EVENT IF EXISTS check_subscription_expiry');

    // Create improved event to check subscription expiry every minute
    await db.query(`
      CREATE EVENT check_subscription_expiry
      ON SCHEDULE EVERY 1 MINUTE
      DO
      BEGIN
        DECLARE done INT DEFAULT FALSE;
        DECLARE sub_id INT;
        DECLARE seller_id INT;
        DECLARE plan_name VARCHAR(255);
        
        -- Create temporary table to store subscriptions to process
        DROP TEMPORARY TABLE IF EXISTS tmp_expired_subs;
        CREATE TEMPORARY TABLE tmp_expired_subs AS
        SELECT s.id, s.seller_id, p.name as plan_name
        FROM seller_subscriptions s
        JOIN subscription_plans p ON s.plan_id = p.id
        WHERE s.status = 'active'
        AND (
          (s.end_date IS NOT NULL AND s.end_date <= CURRENT_TIMESTAMP)
          OR 
          (s.is_trial = true AND s.trial_ends_at <= CURRENT_TIMESTAMP)
        )
        AND NOT EXISTS (
          SELECT 1 
          FROM seller_subscriptions s2 
          WHERE s2.seller_id = s.seller_id 
          AND s2.id > s.id 
          AND s2.status = 'active'
        );

        -- Update status to expired
        UPDATE seller_subscriptions s
        INNER JOIN tmp_expired_subs t ON s.id = t.id
        SET s.status = 'expired';

        -- Insert notifications only for newly expired subscriptions
        INSERT INTO notifications (userId, type, content, created_at)
        SELECT 
          t.seller_id,
          'subscription_expired',
          CONCAT('Your ', t.plan_name, ' subscription has expired. Please renew to continue using all features.'),
          CURRENT_TIMESTAMP
        FROM tmp_expired_subs t
        WHERE NOT EXISTS (
          SELECT 1 
          FROM notifications n
          WHERE n.userId = t.seller_id
          AND n.type = 'subscription_expired'
          AND n.created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 MINUTE)
        );

        -- Clean up
        DROP TEMPORARY TABLE IF EXISTS tmp_expired_subs;
      END;
    `);

    console.log('Subscription expiry event updated successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function down() {
  try {
    await db.query('DROP EVENT IF EXISTS check_subscription_expiry');
    console.log('Subscription expiry event dropped successfully');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  }
}

module.exports = { up, down };
