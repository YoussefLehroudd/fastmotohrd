const { up } = require('./migrations/update_subscription_expire_with_motors');
const db = require('./config/db');

(async () => {
  try {
    console.log('Running subscription expire with motors update migration...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
