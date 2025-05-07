const { up: createProcedure } = require('./migrations/add_subscription_email_procedure_final');
const { up: cleanupEvents } = require('./migrations/cleanup_subscription_events');
const db = require('./config/db');

(async () => {
  try {
    console.log('Running final subscription email fix...');
    
    // First create the email procedure
    console.log('Creating email procedure...');
    await createProcedure();
    
    // Then cleanup and create single event
    console.log('Cleaning up events...');
    await cleanupEvents();
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
