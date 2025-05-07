const { up } = require('./migrations/update_subscription_expire_simple');
const db = require('./config/db');

(async () => {
  try {
    console.log('Running simplified subscription expire update...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
