const { up } = require('./migrations/add_trial_used_to_subscriptions');

up().then(() => {
  console.log('Migration completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
