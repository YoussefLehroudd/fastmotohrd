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
        SET @subscriptions_to_expire = (
          SELECT GROUP_CONCAT(
            CONCAT_WS(',', s.id, s.seller_id, p.name)
            SEPARATOR ';'
          )
          FROM seller_subscriptions s
          JOIN subscription_plans p ON s.plan_id = p.id
          WHERE s.status = 'active' 
          AND (
            (s.is_trial = true AND s.trial_ends_at <= CURRENT_TIMESTAMP)
            OR 
            (s.is_trial = false AND s.end_date <= CURRENT_TIMESTAMP)
          )
        );

        -- Update subscription status
        UPDATE seller_subscriptions 
        SET status = 'expired',
            is_trial_used = CASE 
              WHEN is_trial = true OR status = 'expired' THEN 1 
              ELSE is_trial_used 
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE status = 'active' 
        AND (
          (is_trial = true AND trial_ends_at <= CURRENT_TIMESTAMP)
          OR 
          (is_trial = false AND end_date <= CURRENT_TIMESTAMP)
        );

        -- Send email notifications for expired subscriptions
        IF @subscriptions_to_expire IS NOT NULL THEN
          SET @subscription = @subscriptions_to_expire;
          WHILE @subscription != '' DO
            SET @subscription_data = SUBSTRING_INDEX(@subscription, ';', 1);
            SET @subscription = SUBSTRING(@subscription FROM IF(LOCATE(';', @subscription) > 0, LOCATE(';', @subscription) + 1, LENGTH(@subscription) + 1));
            
            SET @sub_id = SUBSTRING_INDEX(@subscription_data, ',', 1);
            SET @seller_id = SUBSTRING_INDEX(SUBSTRING_INDEX(@subscription_data, ',', 2), ',', -1);
            SET @plan_name = SUBSTRING_INDEX(@subscription_data, ',', -1);

            -- Get seller's email
            SELECT email INTO @seller_email
            FROM users 
            WHERE id = @seller_id;

            -- Call email procedure
            CALL send_subscription_expiry_email(@seller_email, @plan_name);
          END WHILE;
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
