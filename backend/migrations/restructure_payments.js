const db = require('../db');

async function up() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Drop payment_history table if it exists
    await connection.query('DROP TABLE IF EXISTS payment_history');

    // Drop existing payments table
    await connection.query('DROP TABLE IF EXISTS payments');

    // Create new payments table with enhanced structure
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bookingId INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        proofUrl VARCHAR(255),
        status ENUM('pending', 'validated', 'rejected', 'refunded') DEFAULT 'pending',
        paymentType ENUM('deposit', 'rental', 'damage', 'refund') NOT NULL,
        paymentMethod ENUM('cash', 'bank_transfer', 'online') DEFAULT 'cash',
        transactionId VARCHAR(100),
        validationNotes TEXT,
        validatedBy INT,
        validatedAt TIMESTAMP NULL,
        rejectionReason TEXT,
        rejectedBy INT,
        rejectedAt TIMESTAMP NULL,
        refundAmount DECIMAL(10, 2),
        refundReason TEXT,
        refundedBy INT,
        refundedAt TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (bookingId) REFERENCES bookings(id),
        FOREIGN KEY (validatedBy) REFERENCES users(id),
        FOREIGN KEY (rejectedBy) REFERENCES users(id),
        FOREIGN KEY (refundedBy) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.commit();
    console.log('Payments table restructured successfully');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function down() {
  // No down migration needed as this is a restructure
}

module.exports = { up, down };
