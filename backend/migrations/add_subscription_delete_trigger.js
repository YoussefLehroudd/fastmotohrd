const db = require('../config/db');

async function up() {
  try {
    // Drop existing trigger if it exists
    await db.query('DROP TRIGGER IF EXISTS update_listings_after_delete');

    // Create trigger to update listings count on delete
    await db.query(`
      CREATE TRIGGER update_listings_after_delete
      AFTER DELETE ON motors
      FOR EACH ROW
      BEGIN
        IF OLD.sellerId IS NOT NULL THEN
          UPDATE seller_subscriptions 
          SET listings_used = listings_used - 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE seller_id = OLD.sellerId 
          AND status = 'active'
          AND (end_date IS NULL OR end_date > CURRENT_TIMESTAMP);
        END IF;
      END;
    `);

    // Also add a check constraint to prevent listings_used from going below 0
    await db.query(`
      ALTER TABLE seller_subscriptions
      ADD CONSTRAINT check_listings_used 
      CHECK (listings_used >= 0);
    `);

  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    // No need to close connection when using pool
  }
}

async function down() {
  try {
    await db.query('DROP TRIGGER IF EXISTS update_listings_after_delete');
    await db.query('ALTER TABLE seller_subscriptions DROP CONSTRAINT check_listings_used');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  }
}

module.exports = { up, down };
