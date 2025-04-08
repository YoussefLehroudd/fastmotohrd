const db = require('../db');

async function addSellerResponse() {
  try {
    await db.query(`
      ALTER TABLE reviews
      ADD COLUMN seller_response TEXT NULL;
    `);
    
    console.log('Added seller_response column to reviews table');
  } catch (error) {
    console.error('Error adding seller_response column:', error);
    throw error;
  }
}

addSellerResponse()
  .then(() => process.exit())
  .catch(() => process.exit(1));
