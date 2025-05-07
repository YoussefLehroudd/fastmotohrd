const { up } = require('./migrations/add_subscription_events_table');
const db = require('./config/db');

(async () => {
  try {
    console.log('Running subscription events table migration...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
