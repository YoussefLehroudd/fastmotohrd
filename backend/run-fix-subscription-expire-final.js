const { up } = require('./migrations/fix_subscription_expire_final');
const db = require('./config/db');

(async () => {
  try {
    console.log('Running final subscription expire fix...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
