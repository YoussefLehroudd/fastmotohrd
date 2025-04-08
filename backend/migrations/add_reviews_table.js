const db = require('../db');

async function createReviewsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        motor_id INT,
        user_id INT,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (motor_id) REFERENCES motors(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_review (motor_id, user_id)
      );
    `);
    
    console.log('Reviews table created successfully');
  } catch (error) {
    console.error('Error creating reviews table:', error);
    throw error;
  }
}

createReviewsTable()
  .then(() => process.exit())
  .catch(() => process.exit(1));
