const { up } = require('./migrations/add_subscription_expiry_event');

up()
  .then(() => {
    console.log('Subscription expiry event migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
