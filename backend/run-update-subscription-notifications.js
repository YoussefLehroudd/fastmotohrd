const { up } = require('./migrations/update_subscription_notifications');

async function runMigration() {
  try {
    console.log('Running update subscription notifications migration...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
