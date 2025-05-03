const db = require('../config/db');

async function up() {
  try {
    // Create bank_details table
    await db.query(`
      CREATE TABLE IF NOT EXISTS bank_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bank_name VARCHAR(100) NOT NULL,
        account_number VARCHAR(100) NOT NULL,
        beneficiary VARCHAR(100) NOT NULL,
        whatsapp_number VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Insert default bank details
    await db.query(`
      INSERT INTO bank_details (bank_name, account_number, beneficiary, whatsapp_number) VALUES
      ('Attijariwafa bank', '007 810 0004622000000448 02', 'Next Level PC', '+212600000000');
    `);

    console.log('Bank details migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function down() {
  try {
    await db.query('DROP TABLE IF EXISTS bank_details');
    console.log('Bank details table dropped successfully');
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  }
}

module.exports = { up, down };
