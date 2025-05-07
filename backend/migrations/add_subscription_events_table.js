const db = require('../config/db');

async function up() {
  try {
    // Create subscription_events table
    await db.query(`
      CREATE TABLE IF NOT EXISTS subscription_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seller_id INT NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        data JSON NOT NULL,
        processed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Subscription events table created successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function down() {
  try {
    await db.query('DROP TABLE IF EXISTS subscription_events');
    console.log('Subscription events table dropped successfully');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  }
}

module.exports = { up, down };
