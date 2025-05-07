const { up } = require('./migrations/add_subscription_expire_check_trigger');
const db = require('./config/db');

(async () => {
  try {
    console.log('Running subscription expire check trigger migration...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
