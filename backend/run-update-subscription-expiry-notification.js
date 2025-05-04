const { updateSubscriptionExpiryEvent } = require('./migrations/update_subscription_expiry_notification');

updateSubscriptionExpiryEvent()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
