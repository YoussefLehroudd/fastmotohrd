const { up } = require('./migrations/add_bank_details');

up().then(() => {
  console.log('Bank details migration completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Error running bank details migration:', error);
  process.exit(1);
});
