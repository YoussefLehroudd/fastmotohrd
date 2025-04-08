const db = require('../db');

async function up() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Drop unnecessary columns
    await connection.query(`
      ALTER TABLE payments
      DROP COLUMN IF EXISTS total_revenue,
      DROP COLUMN IF EXISTS monthly_revenue,
      DROP COLUMN IF EXISTS pending_amount,
      DROP COLUMN IF EXISTS completed_amount,
      DROP COLUMN IF EXISTS motorName,
      DROP COLUMN IF EXISTS motorDetails,
      DROP COLUMN IF EXISTS customerName,
      DROP COLUMN IF EXISTS customerEmail,
      DROP COLUMN IF EXISTS pending_payments,
      DROP COLUMN IF EXISTS completed_payments
    `);

    // Update ENUM values to be lowercase
    await connection.query(`
      ALTER TABLE payments
      MODIFY COLUMN status ENUM('pending', 'pending_payment', 'validated', 'rejected', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
      MODIFY COLUMN paymentType ENUM('rental', 'deposit', 'damage', 'refund') NOT NULL
    `);

    // Add missing columns if they don't exist
    await connection.query(`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS validationNotes TEXT NULL AFTER validatedBy,
      ADD COLUMN IF NOT EXISTS rejectionReason TEXT NULL AFTER validationNotes,
      ADD COLUMN IF NOT EXISTS rejectedBy INT NULL AFTER rejectionReason,
      ADD COLUMN IF NOT EXISTS rejectedAt TIMESTAMP NULL AFTER rejectedBy,
      ADD FOREIGN KEY IF NOT EXISTS (rejectedBy) REFERENCES users(id)
    `);

    await connection.commit();
    console.log('Successfully cleaned up payments table structure');
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
