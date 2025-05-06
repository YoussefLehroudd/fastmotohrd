const { up } = require('./migrations/add_subscription_delete_trigger');

up().then(() => {
  console.log('Successfully added subscription delete trigger');
  process.exit(0);
}).catch((error) => {
  console.error('Error running migration:', error);
  process.exit(1);
});
