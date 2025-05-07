const { up } = require('./migrations/fix_subscription_expire_duplicate');
const db = require('./config/db');

(async () => {
  try {
    console.log('Running subscription expire fix to prevent duplicate emails...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
