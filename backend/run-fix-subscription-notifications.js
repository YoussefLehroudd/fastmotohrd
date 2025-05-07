const { up } = require('./migrations/fix_subscription_expire_notifications');
const db = require('./config/db');

(async () => {
  try {
    console.log('Running fix for subscription expire notifications...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
