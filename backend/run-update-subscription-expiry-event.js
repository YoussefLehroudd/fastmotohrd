const { up } = require('./migrations/add_subscription_expiry_event');

async function runMigration() {
  try {
    console.log('Running update subscription expiry event migration...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
