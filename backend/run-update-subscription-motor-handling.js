const { up } = require('./migrations/update_subscription_motor_handling');

async function runMigration() {
  try {
    console.log('Running subscription motor handling update...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
