const db = require('../db');

async function addRejectedStatus() {
  try {
    // Add 'rejected' to the status enum
    await db.query(`
      ALTER TABLE bookings 
      MODIFY COLUMN status 
      ENUM('pending', 'confirmed', 'cancelled', 'completed', 'rejected') 
      DEFAULT 'pending'
    `);

    console.log('Successfully added rejected status to bookings table');
  } catch (error) {
    console.error('Error adding rejected status:', error);
    throw error;
  }
}

// Run the migration
addRejectedStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
