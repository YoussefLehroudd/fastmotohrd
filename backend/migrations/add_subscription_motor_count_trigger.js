const db = require('../config/db');

async function up() {
  try {
    // Drop existing triggers
    await db.query('DROP TRIGGER IF EXISTS update_listings_after_insert');
    await db.query('DROP TRIGGER IF EXISTS update_subscription_listings');

    // Create trigger for new motor insertions
    await db.query(`
      CREATE TRIGGER update_listings_after_insert
      AFTER INSERT ON motors
      FOR EACH ROW
      BEGIN
        IF NEW.sellerId IS NOT NULL THEN
          UPDATE seller_subscriptions 
          SET listings_used = listings_used + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE seller_id = NEW.sellerId 
          AND status = 'active'
          AND (end_date IS NULL OR end_date > CURRENT_TIMESTAMP);
        END IF;
      END;
    `);

    // Create trigger for subscription status changes
    await db.query(`
      CREATE TRIGGER update_subscription_listings
      BEFORE UPDATE ON seller_subscriptions
      FOR EACH ROW
      BEGIN
        -- When a subscription becomes active, count existing motors
        IF NEW.status = 'active' AND OLD.status != 'active' THEN
          SET NEW.listings_used = (
            SELECT COUNT(*)
            FROM motors
            WHERE sellerId = NEW.seller_id
            AND status != 'deleted'
          );
        END IF;
      END;
    `);

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function down() {
  try {
    await db.query('DROP TRIGGER IF EXISTS update_listings_after_insert');
    await db.query('DROP TRIGGER IF EXISTS update_subscription_listings');
    console.log('Rollback completed successfully');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  }
}

module.exports = { up, down };
