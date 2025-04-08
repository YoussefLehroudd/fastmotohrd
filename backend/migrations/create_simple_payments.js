const db = require('../db');

async function up() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Drop existing payments table
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS payments');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create new simplified payments table
    await connection.query(`
      CREATE TABLE payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bookingId INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'validated', 'rejected') DEFAULT 'pending',
        paymentMethod ENUM('cash_on_delivery', 'bank_transfer') DEFAULT 'cash_on_delivery',
        proofUrl VARCHAR(255),
        validatedBy INT,
        validatedAt TIMESTAMP NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bookingId) REFERENCES bookings(id),
        FOREIGN KEY (validatedBy) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await connection.commit();
    console.log('Created new simplified payments table');
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
