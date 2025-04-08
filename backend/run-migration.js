const { up: updatePaymentStatuses } = require('./migrations/update_payment_statuses');

async function runMigration() {
  try {
    await updatePaymentStatuses();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
