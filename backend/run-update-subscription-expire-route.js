const { up } = require('./migrations/update_subscription_expire_route');
const db = require('./config/db');

(async () => {
  try {
    console.log('Running update for subscription expire route...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
