const db = require('../config/db');

async function up() {
  try {
    // Drop existing triggers
    await db.query('DROP TRIGGER IF EXISTS update_listings_after_insert');
    await db.query('DROP TRIGGER IF EXISTS update_subscription_on_approval');
    await db.query('DROP PROCEDURE IF EXISTS update_subscription_listings');

    console.log('Old triggers and procedures removed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function down() {
  // No down migration needed since we're removing triggers
  return;
}

module.exports = { up, down };
