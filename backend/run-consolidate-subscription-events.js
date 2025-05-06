const { up } = require('./migrations/consolidate_subscription_events');
const db = require('./config/db');

(async () => {
  try {
    console.log('Running subscription events consolidation...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
