const db = require('../config/db');

async function up() {
  try {
    // Drop existing event if it exists
    await db.query('DROP EVENT IF EXISTS check_subscription_expiry');

    // Enable event scheduler
    await db.query('SET GLOBAL event_scheduler = ON');

    // Create event to check and update expired subscriptions every minute
    await db.query(`
      CREATE EVENT check_subscription_expiry
      ON SCHEDULE EVERY 1 MINUTE
      DO
      BEGIN
        UPDATE seller_subscriptions
        SET status = 'expired'
        WHERE status = 'active'
        AND (
          (end_date IS NOT NULL AND end_date <= CURRENT_TIMESTAMP)
          OR
          (is_trial = true AND trial_ends_at <= CURRENT_TIMESTAMP)
        )
        AND NOT EXISTS (
          SELECT 1 
          FROM seller_subscriptions s2 
          WHERE s2.seller_id = seller_subscriptions.seller_id 
          AND s2.id > seller_subscriptions.id 
          AND s2.status = 'active'
        );
      END;
    `);

    console.log('Subscription auto-expire event created successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function down() {
  try {
    await db.query('DROP EVENT IF EXISTS check_subscription_expiry');
    console.log('Subscription auto-expire event dropped successfully');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  }
}

module.exports = { up, down };
