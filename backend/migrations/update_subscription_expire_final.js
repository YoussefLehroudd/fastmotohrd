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
        -- Get subscriptions that are about to expire
        SET @expired_subscriptions = (
          SELECT GROUP_CONCAT(s.id) 
          FROM seller_subscriptions s
          WHERE s.status = 'active' 
          AND (
            (s.end_date IS NOT NULL AND s.end_date <= CURRENT_TIMESTAMP)
            OR 
            (s.is_trial = true AND s.trial_ends_at <= CURRENT_TIMESTAMP)
          )
        );

        IF @expired_subscriptions IS NOT NULL THEN
          -- Update subscription status to expired
          UPDATE seller_subscriptions s
          SET s.status = 'expired'
          WHERE FIND_IN_SET(s.id, @expired_subscriptions);

          -- Set all motors to not available
          UPDATE motors m
          JOIN seller_subscriptions s ON m.sellerId = s.seller_id
          SET m.isActive = false
          WHERE FIND_IN_SET(s.id, @expired_subscriptions);

          -- Create subscription events for notifications
          INSERT INTO subscription_events (seller_id, event_type, data)
          SELECT 
            s.seller_id,
            'subscription_expired',
            JSON_OBJECT(
              'subscription_id', s.id,
              'plan_name', p.name,
              'expired_at', CURRENT_TIMESTAMP
            )
          FROM seller_subscriptions s
          JOIN subscription_plans p ON s.plan_id = p.id
          WHERE FIND_IN_SET(s.id, @expired_subscriptions)
          AND NOT EXISTS (
            -- Check if we already have an event for this subscription today
            SELECT 1 FROM subscription_events e
            WHERE e.seller_id = s.seller_id
            AND e.event_type = 'subscription_expired'
            AND DATE(e.created_at) = CURRENT_DATE
          );
        END IF;
      END;
    `);

    console.log('Final subscription expire event created successfully');
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
