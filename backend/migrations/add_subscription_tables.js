const mysql = require('mysql2/promise');
const db = require('../config/db');

async function up() {
  const connection = await mysql.createConnection(db);
  try {
    // Create subscription plans table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        duration_months INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        max_listings INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert subscription plans
    await connection.query(`
      INSERT INTO subscription_plans (name, duration_months, price, max_listings) VALUES
      ('Free Trial', 0, 0, 1),
      ('Monthly', 1, 99, 3),
      ('Semi-Annual', 6, 499, 6),
      ('Annual', 12, 899, NULL);
    `);

    // Create seller subscriptions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS seller_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seller_id INT,
        plan_id INT,
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP NULL,
        status VARCHAR(20) DEFAULT 'pending',
        listings_used INT DEFAULT 0,
        is_trial BOOLEAN DEFAULT false,
        trial_ends_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES users(id),
        FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
      );
    `);

    // Drop existing trigger if it exists
    await connection.query('DROP TRIGGER IF EXISTS update_listings_after_insert');

    // Create trigger to update listings count
    await connection.query(`
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
    await connection.query('DROP TRIGGER IF EXISTS update_listings_after_insert');
    await connection.query('DROP TABLE IF EXISTS seller_subscriptions');
    await connection.query('DROP TABLE IF EXISTS subscription_plans');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

module.exports = { up, down };
