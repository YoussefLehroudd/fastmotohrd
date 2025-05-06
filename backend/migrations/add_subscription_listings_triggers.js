const db = require('../config/db');

async function up() {
  try {
    // Drop existing triggers if they exist
    await db.query('DROP TRIGGER IF EXISTS increment_listings_after_insert');
    await db.query('DROP TRIGGER IF EXISTS decrement_listings_after_delete');

    // Create trigger to increment listings_used after motor insert
    await db.query(`
      CREATE TRIGGER increment_listings_after_insert
      AFTER INSERT ON motors
      FOR EACH ROW
      BEGIN
        UPDATE seller_subscriptions 
        SET listings_used = listings_used + 1
        WHERE seller_id = NEW.sellerId 
        AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1;
      END;
    `);

    // Create trigger to decrement listings_used after motor delete
    await db.query(`
      CREATE TRIGGER decrement_listings_after_delete
      AFTER DELETE ON motors
      FOR EACH ROW
      BEGIN
        UPDATE seller_subscriptions 
        SET listings_used = GREATEST(0, listings_used - 1)
        WHERE seller_id = OLD.sellerId 
        AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1;
      END;
    `);

    console.log('Subscription listings triggers created successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function down() {
  try {
    await db.query('DROP TRIGGER IF EXISTS increment_listings_after_insert');
    await db.query('DROP TRIGGER IF EXISTS decrement_listings_after_delete');
    console.log('Subscription listings triggers dropped successfully');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  }
}

module.exports = { up, down };
