const db = require('../config/db');

async function up() {
  try {
    // Enable event scheduler
    await db.query('SET GLOBAL event_scheduler = ON');

    // Drop existing event if it exists
    await db.query('DROP EVENT IF EXISTS subscription_expire_check');

    // Create event to check subscription expiry every second
    await db.query(`
      CREATE EVENT subscription_expire_check
      ON SCHEDULE EVERY 1 SECOND
      DO
      BEGIN
        -- Get subscriptions that are about to expire
        SET @expired_subscriptions = (
          SELECT GROUP_CONCAT(id) 
          FROM seller_subscriptions 
          WHERE status = 'active' 
          AND (
            (end_date IS NOT NULL AND end_date <= CURRENT_TIMESTAMP)
            OR 
            (is_trial = true AND trial_ends_at <= CURRENT_TIMESTAMP)
          )
        );

        IF @expired_subscriptions IS NOT NULL THEN
          -- Call the expire route for each subscription
          SET @url = 'http://localhost:5000/api/subscriptions/expire';
          SET @done = FALSE;
          SET @subscription_id = NULL;
          
          -- Create cursor for expired subscriptions
          BEGIN
            DECLARE cur CURSOR FOR
              SELECT id FROM seller_subscriptions 
              WHERE FIND_IN_SET(id, @expired_subscriptions);
            
            DECLARE CONTINUE HANDLER FOR NOT FOUND SET @done = TRUE;
            
            OPEN cur;
            
            read_loop: LOOP
              FETCH cur INTO @subscription_id;
              IF @done THEN
                LEAVE read_loop;
              END IF;
              
              -- Call the expire route
              DO SLEEP(0.1); -- Small delay to prevent overwhelming the server
              SET @cmd = CONCAT('curl -X POST ', @url, '/', @subscription_id, '/expire');
              SET @result = sys_exec(@cmd);
            END LOOP;
            
            CLOSE cur;
          END;
        END IF;
      END;
    `);

    console.log('Subscription expire event updated to use route successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function down() {
  try {
    await db.query('DROP EVENT IF EXISTS subscription_expire_check');
    console.log('Subscription expire event dropped successfully');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  }
}

module.exports = { up, down };
