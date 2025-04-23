const db = require('../db');

async function up() {
  try {
    // Add admin_messages_count column to chat_rooms table
    await db.query(`
      ALTER TABLE chat_rooms
      ADD COLUMN admin_messages_count INT DEFAULT 0
    `);

    console.log('Added admin_messages_count column to chat_rooms table');
  } catch (error) {
    console.error('Error adding admin_messages_count column:', error);
    throw error;
  }
}

async function down() {
  try {
    // Remove admin_messages_count column from chat_rooms table
    await db.query(`
      ALTER TABLE chat_rooms
      DROP COLUMN admin_messages_count
    `);

    console.log('Removed admin_messages_count column from chat_rooms table');
  } catch (error) {
    console.error('Error removing admin_messages_count column:', error);
    throw error;
  }
}

module.exports = { up, down };
