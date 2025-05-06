const mysql = require('mysql2/promise');
const db = require('../config/db');

async function up() {
  const connection = await mysql.createConnection(db);
  try {
    // Drop existing trigger if it exists
    await connection.query('DROP TRIGGER IF EXISTS update_listings_after_delete');

    // Create trigger to update listings count after motor deletion
    await connection.query(`
      CREATE TRIGGER update_listings_after_delete
      AFTER DELETE ON motors
      FOR EACH ROW
      BEGIN
        UPDATE seller_subscriptions 
        SET listings_used = (
          SELECT COUNT(*) 
          FROM motors 
          WHERE sellerId = OLD.sellerId 
          AND status != 'deleted'
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE seller_id = OLD.sellerId 
        AND status = 'active';
      END;
    `);

    console.log('Motor delete trigger created successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function down() {
  const connection = await mysql.createConnection(db);
  try {
    await connection.query('DROP TRIGGER IF EXISTS update_listings_after_delete');
    console.log('Motor delete trigger dropped successfully');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

module.exports = { up, down };
