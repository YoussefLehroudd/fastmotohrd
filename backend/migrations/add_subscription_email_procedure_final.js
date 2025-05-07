const db = require('../config/db');

async function up() {
  try {
    // Create stored procedure for sending subscription expired email
    await db.query(`
      DROP PROCEDURE IF EXISTS send_subscription_expired_email;
      CREATE PROCEDURE send_subscription_expired_email(
        IN p_email VARCHAR(255),
        IN p_plan_name VARCHAR(255),
        IN p_price DECIMAL(10,2),
        IN p_duration VARCHAR(50),
        IN p_max_listings INT,
        IN p_end_date VARCHAR(50)
      )
      BEGIN
        -- Insert into subscription_events table
        INSERT INTO subscription_events (
          seller_id,
          event_type,
          data,
          processed
        )
        SELECT 
          u.id,
          'subscription_expired',
          JSON_OBJECT(
            'email', p_email,
            'type', 'expired',
            'plan_name', p_plan_name,
            'price', p_price,
            'duration', p_duration,
            'max_listings', p_max_listings,
            'end_date', p_end_date
          ),
          FALSE
        FROM users u
        WHERE u.email = p_email;
      END;
    `);

    console.log('Subscription email procedure created successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function down() {
  try {
    await db.query('DROP PROCEDURE IF EXISTS send_subscription_expired_email');
    console.log('Subscription email procedure dropped successfully');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  }
}

module.exports = { up, down };
