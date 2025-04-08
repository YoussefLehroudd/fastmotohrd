const db = require('../db');

async function up() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // First, make sure the payments table has all necessary fields
    await connection.query(`
      ALTER TABLE payments 
      ADD COLUMN IF NOT EXISTS validationNotes TEXT,
      ADD COLUMN IF NOT EXISTS validatedBy INT,
      ADD COLUMN IF NOT EXISTS validatedAt TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS rejectionReason TEXT,
      ADD COLUMN IF NOT EXISTS rejectedBy INT,
      ADD COLUMN IF NOT EXISTS rejectedAt TIMESTAMP NULL,
      ADD FOREIGN KEY IF NOT EXISTS (validatedBy) REFERENCES users(id),
      ADD FOREIGN KEY IF NOT EXISTS (rejectedBy) REFERENCES users(id)
    `);

    // Drop the payment_history table
    await connection.query('DROP TABLE IF EXISTS payment_history');

    await connection.commit();
    console.log('Successfully removed payment_history table');
  } catch (error) {
    await connection.rollback();
    console.error('Error in migration:', error);
    throw error;
  } finally {
    connection.release();
  }
}

async function down() {
  // No down migration needed as we're removing a redundant table
}

module.exports = { up, down };
