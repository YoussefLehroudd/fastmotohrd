const db = require('../db');

async function addCountryCodeField() {
  try {
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS countryCode VARCHAR(10) DEFAULT '+212'
    `);
    console.log('Successfully added countryCode field');
  } catch (error) {
    console.error('Error adding countryCode field:', error);
    throw error;
  }
}

addCountryCodeField();
