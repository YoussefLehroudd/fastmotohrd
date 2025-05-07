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
          SELECT GROUP_CONCAT(DISTINCT s.id) 
          FROM seller_subscriptions s
          JOIN users u ON s.seller_id = u.id
          JOIN subscription_plans p ON s.plan_id = p.id
          WHERE s.status = 'active' 
          AND (
            (s.end_date IS NOT NULL AND s.end_date <= CURRENT_TIMESTAMP)
            OR 
            (s.is_trial = true AND s.trial_ends_at <= CURRENT_TIMESTAMP)
          )
          -- Only include subscriptions that don't have a notification today
          AND NOT EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.userId = s.seller_id
            AND n.type = 'subscription_expired'
            AND DATE(n.created_at) = CURRENT_DATE
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

          -- Create notifications
          INSERT INTO notifications (userId, type, content, priority)
          SELECT DISTINCT
            s.seller_id,
            'subscription_expired',
            CONCAT('Your ', p.name, ' subscription has expired. Please renew to continue using all features.'),
            'high'
          FROM seller_subscriptions s
          JOIN subscription_plans p ON s.plan_id = p.id
          WHERE FIND_IN_SET(s.id, @expired_subscriptions);

          -- Call email API for each expired subscription
          SET @subscription = @expired_subscriptions;
          WHILE @subscription != '' DO
            SET @subscription_id = SUBSTRING_INDEX(@subscription, ',', 1);
            SET @subscription = SUBSTRING(@subscription, LENGTH(@subscription_id) + 2);
            
            -- Get subscription details
            SELECT s.seller_id, u.email, p.name INTO @seller_id, @email, @plan_name
            FROM seller_subscriptions s
            JOIN users u ON s.seller_id = u.id
            JOIN subscription_plans p ON s.plan_id = p.id
            WHERE s.id = @subscription_id;
            
            -- Call email API
            SET @url = CONCAT('http://localhost:5000/api/subscriptions/', @subscription_id, '/expire');
            DO SLEEP(0.1); -- Small delay to prevent overwhelming the server
            SET @result = sys_exec(CONCAT('curl -X POST ', @url));
          END WHILE;
        END IF;
      END;
    `);

    console.log('Subscription expire event with direct email sending created successfully');
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
