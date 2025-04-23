const db = require('../db');

async function up() {
  try {
    // Add unread_count column to chat_rooms table
    await db.query(`
      ALTER TABLE chat_rooms
      ADD COLUMN unread_count INT DEFAULT 0
    `);

    console.log('Added unread_count column to chat_rooms table');
  } catch (error) {
    console.error('Error adding unread_count column:', error);
    throw error;
  }
}

async function down() {
  try {
    // Remove unread_count column from chat_rooms table
    await db.query(`
      ALTER TABLE chat_rooms
      DROP COLUMN unread_count
    `);

    console.log('Removed unread_count column from chat_rooms table');
  } catch (error) {
    console.error('Error removing unread_count column:', error);
    throw error;
  }
}

module.exports = { up, down };
