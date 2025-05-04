const db = require('../config/db');

async function up() {
  try {
    await db.query(`
      ALTER TABLE seller_subscriptions 
      ADD COLUMN is_trial_used BOOLEAN DEFAULT false
    `);
    
    console.log('Successfully added is_trial_used column to seller_subscriptions table');
  } catch (error) {
    console.error('Error adding is_trial_used column:', error);
    throw error;
  }
}

async function down() {
  try {
    await db.query(`
      ALTER TABLE seller_subscriptions 
      DROP COLUMN is_trial_used
    `);
    
    console.log('Successfully removed is_trial_used column from seller_subscriptions table');
  } catch (error) {
    console.error('Error removing is_trial_used column:', error);
    throw error;
  }
}

module.exports = { up, down };
