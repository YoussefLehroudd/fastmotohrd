const { up } = require('./migrations/add_subscription_expire_event');
const db = require('./config/db');

(async () => {
  try {
    console.log('Running subscription expire event migration...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
