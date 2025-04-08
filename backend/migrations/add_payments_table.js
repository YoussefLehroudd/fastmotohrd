const db = require('../db');

async function up() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bookingId INT,
      amount DECIMAL(10,2) NOT NULL,
      paymentType VARCHAR(50) NOT NULL,
      paymentMethod VARCHAR(50),
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      proofUrl VARCHAR(255),
      transactionId VARCHAR(100),
      refundAmount DECIMAL(10,2),
      refundReason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (bookingId) REFERENCES bookings(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Update any existing null or empty status values to 'pending'
  await db.query(`
    UPDATE payments 
    SET status = 'pending' 
    WHERE status IS NULL OR status = ''
  `);

  console.log('Payments table created successfully');
}

async function down() {
  await db.query(`
    DROP TABLE IF EXISTS payments;
  `);
}

module.exports = { up, down };
