const db = require('../config/db');

async function updateSubscriptionExpiryEvent() {
  try {
    await db.query(`
      DROP EVENT IF EXISTS subscription_expiry_check;
      
      CREATE EVENT subscription_expiry_check
      ON SCHEDULE EVERY 1 MINUTE
      DO
      BEGIN
        -- Get subscriptions that are about to expire
        SELECT s.id, s.seller_id, u.email, p.name as plan_name, p.price, p.duration_months, p.max_listings
        INTO @sub_id, @seller_id, @seller_email, @plan_name, @price, @duration, @max_listings
        FROM seller_subscriptions s
        JOIN users u ON s.seller_id = u.id
        JOIN subscription_plans p ON s.plan_id = p.id
        WHERE s.status = 'active' 
        AND (
          (s.is_trial = true AND s.trial_ends_at <= CURRENT_TIMESTAMP)
          OR 
          (s.is_trial = false AND s.end_date <= CURRENT_TIMESTAMP)
        )
        LIMIT 1;

        IF @sub_id IS NOT NULL THEN
          -- Update subscription status
          UPDATE seller_subscriptions 
          SET status = 'expired',
              is_trial_used = CASE 
                WHEN is_trial = true OR status = 'expired' THEN 1 
                ELSE is_trial_used 
              END,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = @sub_id;

          -- Insert notification
          INSERT INTO notifications (userId, type, content, created_at)
          VALUES (
            @seller_id,
            'subscription_expired',
            JSON_OBJECT(
              'subscription_id', @sub_id,
              'plan_name', @plan_name,
              'price', @price,
              'duration', CASE WHEN @duration = 1 THEN '1 month' ELSE CONCAT(@duration, ' months') END,
              'max_listings', @max_listings,
              'expired_at', CURRENT_TIMESTAMP
            ),
            CURRENT_TIMESTAMP
          );

          -- Call Node.js function to send email
          DO sys_exec(CONCAT(
            'node -e "',
            'const { sendSubscriptionEmail } = require(''./utils/emailService'');',
            'sendSubscriptionEmail(''', @seller_email, ''', {',
            '  type: ''expired'',',
            '  planName: ''', @plan_name, ''',',
            '  price: ', @price, ',',
            '  duration: ''', CASE WHEN @duration = 1 THEN '1 month' ELSE CONCAT(@duration, ' months') END, ''',',
            '  maxListings: ', @max_listings,
            '});"'
          ));
        END IF;
      END;
    `);

    console.log('Subscription expiry event updated successfully');
  } catch (error) {
    console.error('Error updating subscription expiry event:', error);
    throw error;
  }
}

updateSubscriptionExpiryEvent()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
