const db = require('../db');

async function up() {
  try {
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN google_id VARCHAR(255) NULL,
      ADD COLUMN google_email VARCHAR(255) NULL,
      ADD UNIQUE KEY google_id_unique (google_id),
      ADD UNIQUE KEY google_email_unique (google_email)
    `);
    console.log('Added Google account columns to users table');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

module.exports = { up };
