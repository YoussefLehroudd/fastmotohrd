const { up } = require('./migrations/cleanup_subscription_events');
const db = require('./config/db');

(async () => {
  try {
    console.log('Running cleanup of subscription events...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
