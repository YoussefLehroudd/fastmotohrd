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
        -- Get sellers whose subscriptions just expired
        SET @expired_sellers = (
          SELECT GROUP_CONCAT(seller_id) 
          FROM seller_subscriptions 
          WHERE status = 'active' 
          AND (
            (end_date IS NOT NULL AND end_date <= CURRENT_TIMESTAMP)
            OR 
            (is_trial = true AND trial_ends_at <= CURRENT_TIMESTAMP)
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

        -- If any subscriptions expired, update their motors
        IF @expired_sellers IS NOT NULL THEN
          -- Set all motors for expired sellers to not available
          UPDATE motors 
          SET isActive = false
          WHERE sellerId IN (
            SELECT seller_id 
            FROM seller_subscriptions 
            WHERE status = 'expired' 
            AND FIND_IN_SET(seller_id, @expired_sellers)
          );
        END IF;
      END;
    `);

    console.log('Subscription expire event with motor updates created successfully');
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
