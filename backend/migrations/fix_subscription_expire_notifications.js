const db = require('../config/db');

async function up() {
  try {
    // Enable event scheduler
    await db.query('SET GLOBAL event_scheduler = ON');

    // Drop existing event if it exists
    await db.query('DROP EVENT IF EXISTS subscription_expire_check');

    // Create event to check subscription expiry every second
    await db.query(`
      CREATE EVENT subscription_expire_check
      ON SCHEDULE EVERY 1 SECOND
      DO
      BEGIN
        -- Get sellers whose subscriptions just expired and haven't been notified
        SET @expired_sellers = (
          SELECT GROUP_CONCAT(s.seller_id) 
          FROM seller_subscriptions s
          WHERE s.status = 'active' 
          AND (
            (s.end_date IS NOT NULL AND s.end_date <= CURRENT_TIMESTAMP)
            OR 
            (s.is_trial = true AND s.trial_ends_at <= CURRENT_TIMESTAMP)
          )
          -- Only include sellers who haven't received an expiration notification
          AND NOT EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.userId = s.seller_id 
            AND n.type = 'subscription_expired'
            AND DATE(n.created_at) = CURRENT_DATE
          )
        );

        -- Update subscription status to expired
        UPDATE seller_subscriptions 
        SET status = 'expired'
        WHERE status = 'active' 
        AND (
          (end_date IS NOT NULL AND end_date <= CURRENT_TIMESTAMP)
          OR 
          (is_trial = true AND trial_ends_at <= CURRENT_TIMESTAMP)
        );

        -- If any subscriptions expired and need notification
        IF @expired_sellers IS NOT NULL THEN
          -- Set all motors for expired sellers to not available
          UPDATE motors 
          SET isActive = false
          WHERE sellerId IN (
            SELECT DISTINCT seller_id 
            FROM seller_subscriptions 
            WHERE status = 'expired' 
            AND FIND_IN_SET(seller_id, @expired_sellers)
          );

          -- Insert single notification for each expired seller
          INSERT INTO notifications (userId, type, content, created_at)
          SELECT DISTINCT
            s.seller_id,
            'subscription_expired',
            CONCAT('Your ', p.name, ' subscription has expired. Please renew to continue using all features.'),
            CURRENT_TIMESTAMP
          FROM seller_subscriptions s
          JOIN subscription_plans p ON s.plan_id = p.id
          WHERE s.status = 'expired' 
          AND FIND_IN_SET(s.seller_id, @expired_sellers)
          -- Double check no notification exists
          AND NOT EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.userId = s.seller_id 
            AND n.type = 'subscription_expired'
            AND DATE(n.created_at) = CURRENT_DATE
          );

          -- Insert single email event for each expired seller
          INSERT INTO subscription_events (seller_id, event_type, data)
          SELECT DISTINCT
            s.seller_id,
            'subscription_expired',
            JSON_OBJECT(
              'email', u.email,
              'plan_name', p.name,
              'expired_at', CURRENT_TIMESTAMP
            )
          FROM seller_subscriptions s
          JOIN users u ON s.seller_id = u.id
          JOIN subscription_plans p ON s.plan_id = p.id
          WHERE s.status = 'expired'
          AND FIND_IN_SET(s.seller_id, @expired_sellers)
          -- Double check no email event exists
          AND NOT EXISTS (
            SELECT 1 FROM subscription_events e 
            WHERE e.seller_id = s.seller_id 
            AND e.event_type = 'subscription_expired'
            AND DATE(e.created_at) = CURRENT_DATE
          );
        END IF;
      END;
    `);

    console.log('Fixed subscription expire event with single notifications created successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function down() {
  try {
    await db.query('DROP EVENT IF EXISTS subscription_expire_check');
    console.log('Subscription expire event dropped successfully');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  }
}

module.exports = { up, down };
