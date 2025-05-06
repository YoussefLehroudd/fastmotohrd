const { up } = require('./migrations/update_subscription_expiry_check');
const db = require('./config/db');

(async () => {
  try {
    console.log('Running update subscription expiry check migration...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
