const { up: createSimplePayments } = require('./migrations/create_simple_payments');
const { up: addStripeSupport } = require('./migrations/add_stripe_support');

async function runMigration() {
  try {
    await createSimplePayments();
    await addStripeSupport();
    console.log('Payments migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Payments migration failed:', error);
    process.exit(1);
  }
}

runMigration();
