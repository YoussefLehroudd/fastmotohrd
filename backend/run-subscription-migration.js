const { up } = require('./migrations/add_subscription_tables');

(async () => {
  try {
    await up();
    console.log('Subscription tables migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
