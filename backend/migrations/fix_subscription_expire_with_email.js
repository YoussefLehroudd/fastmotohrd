const db = require('../config/db');

async function up() {
  try {
    // Enable event scheduler
    await db.query('SET GLOBAL event_scheduler = ON');

    // Drop existing event if it exists
    await db.query('DROP EVENT IF EXISTS subscription_expire_check');

    // Create stored procedure for sending email
    await db.query(`
      DROP PROCEDURE IF EXISTS send_subscription_expired_email;
      CREATE PROCEDURE send_subscription_expired_email(
        IN p_seller_id INT,
        IN p_plan_name VARCHAR(255)
      )
      BEGIN
        DECLARE v_email VARCHAR(255);
        
        -- Get seller's email
        SELECT email INTO v_email
        FROM users
        WHERE id = p_seller_id;
        
        -- Insert email event
        INSERT INTO subscription_events (seller_id, event_type, data)
        VALUES (
          p_seller_id,
          'subscription_expired',
          JSON_OBJECT(
            'email', v_email,
            'plan_name', p_plan_name,
            'type', 'expired'
          )
        );
      END;
    `);

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

          -- Create notifications and send emails for each expired subscription
          INSERT INTO notifications (userId, type, content, priority)
          SELECT 
            s.seller_id,
            'subscription_expired',
            CONCAT('Your ', p.name, ' subscription has expired. Please renew to continue using all features.'),
            'high'
          FROM seller_subscriptions s
          JOIN subscription_plans p ON s.plan_id = p.id
          WHERE FIND_IN_SET(s.id, @expired_subscriptions);

          -- Call email procedure for each expired subscription
          SET @subscription = @expired_subscriptions;
          WHILE @subscription != '' DO
            SET @subscription_id = SUBSTRING_INDEX(@subscription, ',', 1);
            SET @subscription = SUBSTRING(@subscription, LENGTH(@subscription_id) + 2);
            
            SELECT seller_id, p.name INTO @seller_id, @plan_name
            FROM seller_subscriptions s
            JOIN subscription_plans p ON s.plan_id = p.id
            WHERE s.id = @subscription_id;
            
            CALL send_subscription_expired_email(@seller_id, @plan_name);
          END WHILE;
        END IF;
      END;
    `);

    console.log('Subscription expire event with email notifications created successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function down() {
  try {
    await db.query('DROP EVENT IF EXISTS subscription_expire_check');
    await db.query('DROP PROCEDURE IF EXISTS send_subscription_expired_email');
    console.log('Subscription expire event and procedure dropped successfully');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  }
}

module.exports = { up, down };
