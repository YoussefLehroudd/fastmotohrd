const { up } = require('./migrations/add_subscription_motor_count_trigger');

async function runMigration() {
  try {
    console.log('Running subscription motor count trigger migration...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
