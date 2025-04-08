const db = require('../db');

async function addSellerProfileFields() {
  try {
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS profileImageUrl VARCHAR(255)
    `);
    console.log('Successfully added seller profile fields');
  } catch (error) {
    console.error('Error adding seller profile fields:', error);
    throw error;
  }
}

addSellerProfileFields();
