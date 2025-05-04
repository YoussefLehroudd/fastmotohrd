const mysql = require('mysql2/promise');
const db = require('../config/db');

async function up() {
  const connection = await mysql.createConnection(db);
  try {
    // Enable event scheduler if not enabled
    await connection.query('SET GLOBAL event_scheduler = ON');

    // Drop existing event if it exists
    await connection.query('DROP EVENT IF EXISTS check_subscription_expiry');

    // Create event to check subscription expiry every minute
    await connection.query(`
      CREATE EVENT check_subscription_expiry
      ON SCHEDULE EVERY 1 MINUTE
      DO
      BEGIN
        -- Update expired subscriptions
        UPDATE seller_subscriptions
        SET status = 'expired'
        WHERE (
          (status = 'active' AND end_date IS NOT NULL AND end_date <= CURRENT_TIMESTAMP)
          OR
          (status = 'active' AND is_trial = true AND trial_ends_at <= CURRENT_TIMESTAMP)
        );

        -- Insert notifications for newly expired subscriptions
        INSERT INTO notifications (userId, type, content, created_at)
        SELECT 
          s.seller_id,
          'subscription_expired',
          JSON_OBJECT(
            'subscription_id', s.id,
            'plan_name', p.name,
            'expired_at', 
            CASE 
              WHEN s.is_trial THEN s.trial_ends_at
              ELSE s.end_date
            END
          ),
          CURRENT_TIMESTAMP
        FROM seller_subscriptions s
        JOIN subscription_plans p ON s.plan_id = p.id
        WHERE s.status = 'expired'
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.userId = s.seller_id 
          AND n.type = 'subscription_expired'
          AND JSON_EXTRACT(n.content, '$.subscription_id') = s.id
        );
      END;
    `);

    console.log('Subscription expiry event created successfully');
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
    await connection.query('DROP EVENT IF EXISTS check_subscription_expiry');
    console.log('Subscription expiry event dropped successfully');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

module.exports = { up, down };
