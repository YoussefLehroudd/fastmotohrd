const { up } = require('./migrations/add_subscription_auto_expire_trigger');
const db = require('./config/db');

(async () => {
  try {
    console.log('Running subscription auto-expire trigger migration...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
