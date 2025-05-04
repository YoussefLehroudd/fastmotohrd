const db = require('../config/db');

async function addSubscriptionEmailProcedure() {
  try {
    await db.query(`
      DROP PROCEDURE IF EXISTS send_subscription_expiry_email;

      CREATE PROCEDURE send_subscription_expiry_email(
        IN p_email VARCHAR(255),
        IN p_plan_name VARCHAR(255)
      )
      BEGIN
        DECLARE node_env VARCHAR(255);
        SELECT value INTO node_env FROM system_settings WHERE name = 'NODE_ENV' LIMIT 1;

        -- Insert into email queue table
        INSERT INTO email_queue (
          recipient_email,
          subject,
          template_name,
          template_data,
          priority,
          status,
          created_at
        )
        VALUES (
          p_email,
          'FastMoto - Subscription Expired',
          'subscription_expired',
          JSON_OBJECT(
            'type', 'expired',
            'planName', p_plan_name
          ),
          'high',
          'pending',
          CURRENT_TIMESTAMP
        );

        -- If in development, log the email
        IF node_env = 'development' THEN
          INSERT INTO email_logs (
            recipient,
            subject,
            content,
            sent_at
          )
          VALUES (
            p_email,
            'FastMoto - Subscription Expired',
            CONCAT('Subscription expired for plan: ', p_plan_name),
            CURRENT_TIMESTAMP
          );
        END IF;
      END;
    `);

    console.log('Subscription email procedure created successfully');
  } catch (error) {
    console.error('Error creating subscription email procedure:', error);
    throw error;
  }
}

addSubscriptionEmailProcedure()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
