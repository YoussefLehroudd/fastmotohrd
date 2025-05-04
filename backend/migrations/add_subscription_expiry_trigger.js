const db = require('../config/db');

async function up() {
  const connection = await db.getConnection();
  try {
    // Drop existing trigger if it exists
    await connection.query('DROP TRIGGER IF EXISTS subscription_expiry_trigger');

    // Create trigger that runs after update on seller_subscriptions
    await connection.query(`
      CREATE TRIGGER subscription_expiry_trigger
      AFTER UPDATE ON seller_subscriptions
      FOR EACH ROW
      BEGIN
        IF NEW.status = 'expired' AND OLD.status != 'expired' THEN
          -- Insert into notifications table
          INSERT INTO notifications (userId, type, content, created_at)
          SELECT 
            NEW.seller_id,
            'subscription_expired',
            JSON_OBJECT(
              'subscription_id', NEW.id,
              'plan_name', (SELECT name FROM subscription_plans WHERE id = NEW.plan_id),
              'expired_at', CASE 
                WHEN NEW.is_trial THEN NEW.trial_ends_at
                ELSE NEW.end_date
              END
            ),
            CURRENT_TIMESTAMP;

          -- Insert into a temporary table to trigger socket event
          INSERT INTO subscription_events (seller_id, event_type, subscription_id)
          VALUES (NEW.seller_id, 'expired', NEW.id);
        END IF;
      END;
    `);

    // Create subscription_events table for socket notifications
    await connection.query(`
      CREATE TABLE IF NOT EXISTS subscription_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seller_id INT NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        subscription_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (seller_id) REFERENCES users(id),
        FOREIGN KEY (subscription_id) REFERENCES seller_subscriptions(id)
      )
    `);

    console.log('Subscription expiry trigger created successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

async function down() {
  const connection = await db.getConnection();
  try {
    await connection.query('DROP TRIGGER IF EXISTS subscription_expiry_trigger');
    await connection.query('DROP TABLE IF EXISTS subscription_events');
    console.log('Subscription expiry trigger dropped successfully');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { up, down };
