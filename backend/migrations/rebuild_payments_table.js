const db = require('../db');

async function up() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Create a temporary table with the correct structure
    await connection.query(`
      CREATE TABLE payments_new (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bookingId INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        proofUrl VARCHAR(255),
        status ENUM('pending', 'pending_payment', 'validated', 'rejected', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
        paymentType ENUM('rental', 'deposit', 'damage', 'refund') NOT NULL,
        paymentMethod VARCHAR(50),
        transactionId VARCHAR(100),
        validatedBy INT,
        validatedAt TIMESTAMP NULL,
        validationNotes TEXT,
        rejectedBy INT,
        rejectedAt TIMESTAMP NULL,
        rejectionReason TEXT,
        refundAmount DECIMAL(10, 2),
        refundReason TEXT,
        receiptNumber VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bookingId) REFERENCES bookings(id),
        FOREIGN KEY (validatedBy) REFERENCES users(id),
        FOREIGN KEY (rejectedBy) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Copy data from old table to new table
    await connection.query(`
      INSERT INTO payments_new (
        id, bookingId, amount, proofUrl, status, paymentType, 
        paymentMethod, transactionId, validatedBy, validatedAt,
        refundAmount, refundReason, receiptNumber, created_at
      )
      SELECT 
        id, bookingId, amount, proofUrl, 
        CASE 
          WHEN status = 'PENDING' THEN 'pending'
          WHEN status = 'PENDING_PAYMENT' THEN 'pending_payment'
          WHEN status = 'VALIDATED' THEN 'validated'
          WHEN status = 'REJECTED' THEN 'rejected'
          WHEN status = 'CANCELLED' THEN 'cancelled'
          WHEN status = 'REFUNDED' THEN 'refunded'
          ELSE 'pending'
        END as status,
        CASE 
          WHEN paymentType = 'RENTAL' THEN 'rental'
          WHEN paymentType = 'DEPOSIT' THEN 'deposit'
          WHEN paymentType = 'DAMAGE' THEN 'damage'
          WHEN paymentType = 'REFUND' THEN 'refund'
          ELSE 'rental'
        END as paymentType,
        paymentMethod, transactionId, validatedBy, validatedAt,
        refundAmount, refundReason, receiptNumber, created_at
      FROM payments
    `);

    // Drop the old table
    await connection.query('DROP TABLE payments');

    // Rename the new table
    await connection.query('RENAME TABLE payments_new TO payments');

    await connection.commit();
    console.log('Successfully rebuilt payments table');
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
