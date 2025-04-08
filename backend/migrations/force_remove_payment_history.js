const db = require('../db');

async function up() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Drop the payment_history table forcefully
    await connection.query('DROP TABLE IF EXISTS payment_history');

    // Add necessary columns to payments table
    await connection.query(`
      ALTER TABLE payments 
      ADD COLUMN IF NOT EXISTS validationNotes TEXT,
      ADD COLUMN IF NOT EXISTS validatedBy INT,
      ADD COLUMN IF NOT EXISTS validatedAt TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS rejectionReason TEXT,
      ADD COLUMN IF NOT EXISTS rejectedBy INT,
      ADD COLUMN IF NOT EXISTS rejectedAt TIMESTAMP NULL
    `);

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    await connection.commit();
    console.log('Successfully removed payment_history table and updated payments table');
  } catch (error) {
    await connection.rollback();
    console.error('Error in migration:', error);
    throw error;
  } finally {
    connection.release();
  }
}

async function down() {
  // No down migration needed
}

module.exports = { up, down };
