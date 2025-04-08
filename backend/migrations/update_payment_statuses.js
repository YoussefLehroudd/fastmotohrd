const db = require('../db');

async function up() {
  try {
    // Update any existing null or empty status values to 'pending'
    await db.query(`
      UPDATE payments 
      SET status = 'pending' 
      WHERE status IS NULL OR status = ''
    `);

    // Update payment types to ensure consistency
    await db.query(`
      UPDATE payments p
      JOIN bookings b ON p.bookingId = b.id
      SET p.paymentType = 'rental'
      WHERE p.paymentType IS NULL OR p.paymentType = ''
    `);

    // Set default values for any NULL amounts
    await db.query(`
      UPDATE payments 
      SET amount = 0.00 
      WHERE amount IS NULL
    `);

    console.log('Successfully updated payment statuses');
  } catch (error) {
    console.error('Error updating payment statuses:', error);
    throw error;
  }
}

async function down() {
  // No down migration needed as we don't want to revert these fixes
}

module.exports = { up, down };
