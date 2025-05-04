const { up } = require('./migrations/add_subscription_expiry_trigger');

up().then(() => {
  console.log('Migration completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
