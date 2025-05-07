const { up } = require('./migrations/fix_subscription_expire_with_email');
const db = require('./config/db');

(async () => {
  try {
    console.log('Running subscription expire fix with email...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
