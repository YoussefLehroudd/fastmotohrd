const db = require('../config/db');

async function up() {
  try {
    // Drop existing trigger if it exists
    await db.query('DROP TRIGGER IF EXISTS subscription_expire_check');

    // Create trigger to check subscription expiry on each access
    await db.query(`
      CREATE TRIGGER subscription_expire_check
      BEFORE UPDATE ON seller_subscriptions
      FOR EACH ROW
      BEGIN
        IF NEW.status = 'active' AND (
          (NEW.end_date IS NOT NULL AND NEW.end_date <= CURRENT_TIMESTAMP)
          OR 
          (NEW.is_trial = true AND NEW.trial_ends_at <= CURRENT_TIMESTAMP)
        ) THEN
          SET NEW.status = 'expired';
        END IF;
      END;
    `);

    console.log('Subscription expire check trigger created successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function down() {
  try {
    await db.query('DROP TRIGGER IF EXISTS subscription_expire_check');
    console.log('Subscription expire check trigger dropped successfully');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  }
}

module.exports = { up, down };
