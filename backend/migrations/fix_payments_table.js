const db = require('../db');

async function up() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Drop each column individually to handle any dependency issues
    const columnsToDrop = [
      'total_revenue',
      'monthly_revenue',
      'pending_amount',
      'completed_amount',
      'motorName',
      'motorDetails',
      'customerName',
      'customerEmail',
      'pending_payments',
      'completed_payments'
    ];

    for (const column of columnsToDrop) {
      try {
        await connection.query(`ALTER TABLE payments DROP COLUMN ${column}`);
        console.log(`Dropped column: ${column}`);
      } catch (e) {
        console.log(`Column ${column} might not exist, continuing...`);
      }
    }

    // Recreate the status and paymentType ENUMs
    await connection.query(`
      ALTER TABLE payments 
      MODIFY COLUMN status ENUM('pending', 'pending_payment', 'validated', 'rejected', 'cancelled', 'refunded') 
      NOT NULL DEFAULT 'pending'
    `);

    await connection.query(`
      ALTER TABLE payments 
      MODIFY COLUMN paymentType ENUM('rental', 'deposit', 'damage', 'refund') 
      NOT NULL
    `);

    // Add validation and rejection columns
    await connection.query(`
      ALTER TABLE payments 
      ADD COLUMN IF NOT EXISTS validationNotes TEXT NULL,
      ADD COLUMN IF NOT EXISTS rejectionReason TEXT NULL,
      ADD COLUMN IF NOT EXISTS rejectedBy INT NULL,
      ADD COLUMN IF NOT EXISTS rejectedAt TIMESTAMP NULL
    `);

    // Add foreign key for rejectedBy if it doesn't exist
    await connection.query(`
      ALTER TABLE payments
      ADD CONSTRAINT IF NOT EXISTS fk_payments_rejected_by
      FOREIGN KEY (rejectedBy) REFERENCES users(id)
    `);

    await connection.commit();
    console.log('Successfully fixed payments table structure');
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
