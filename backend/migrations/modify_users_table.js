const db = require('../db');

async function up() {
  try {
    // Modify existing users table
    await db.query(`
      ALTER TABLE users
      MODIFY username varchar(255) NOT NULL,
      MODIFY email varchar(255) NOT NULL,
      ADD COLUMN IF NOT EXISTS phone varchar(20) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS address text DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS bio text DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS profileImageUrl varchar(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS countryCode varchar(10) DEFAULT '+212'
    `);

    console.log('Users table updated successfully');
  } catch (error) {
    console.error('Error updating users table:', error);
    throw error;
  }
}

async function down() {
  try {
    // Revert changes
    await db.query(`
      ALTER TABLE users
      MODIFY username varchar(50) NOT NULL,
      MODIFY email varchar(100) NOT NULL,
      DROP COLUMN IF EXISTS phone,
      DROP COLUMN IF EXISTS address,
      DROP COLUMN IF EXISTS bio,
      DROP COLUMN IF EXISTS profileImageUrl,
      DROP COLUMN IF EXISTS countryCode
    `);

    console.log('Users table reverted successfully');
  } catch (error) {
    console.error('Error reverting users table:', error);
    throw error;
  }
}

module.exports = { up, down };
