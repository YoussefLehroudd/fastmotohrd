const db = require('../db');

async function up() {
  try {
    // First check if columns exist
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'chat_messages'
    `);
    const existingColumns = columns.map(col => col.COLUMN_NAME.toLowerCase());

    // Add read status columns if they don't exist
    if (!existingColumns.includes('admin_read')) {
      await db.query('ALTER TABLE chat_messages ADD COLUMN admin_read BOOLEAN DEFAULT FALSE');
    }
    if (!existingColumns.includes('seller_read')) {
      await db.query('ALTER TABLE chat_messages ADD COLUMN seller_read BOOLEAN DEFAULT FALSE');
    }
    if (!existingColumns.includes('user_read')) {
      await db.query('ALTER TABLE chat_messages ADD COLUMN user_read BOOLEAN DEFAULT FALSE');
    }

    // Check chat_rooms columns
    const [roomColumns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'chat_rooms'
    `);
    const existingRoomColumns = roomColumns.map(col => col.COLUMN_NAME.toLowerCase());

    // Add unread count columns if they don't exist
    if (!existingRoomColumns.includes('admin_unread_count')) {
      await db.query('ALTER TABLE chat_rooms ADD COLUMN admin_unread_count INT DEFAULT 0');
    }
    if (!existingRoomColumns.includes('seller_unread_count')) {
      await db.query('ALTER TABLE chat_rooms ADD COLUMN seller_unread_count INT DEFAULT 0');
    }
    if (!existingRoomColumns.includes('user_unread_count')) {
      await db.query('ALTER TABLE chat_rooms ADD COLUMN user_unread_count INT DEFAULT 0');
    }

    // Initialize read status from existing is_read column if it exists
    if (existingColumns.includes('is_read')) {
      await db.query(`
        UPDATE chat_messages 
        SET admin_read = is_read,
            seller_read = is_read,
            user_read = is_read
      `);
    }

    // Initialize unread counts from existing unread_count if it exists
    if (existingRoomColumns.includes('unread_count')) {
      await db.query(`
        UPDATE chat_rooms 
        SET admin_unread_count = unread_count,
            seller_unread_count = unread_count,
            user_unread_count = unread_count
      `);
    }

    console.log('Added separate read status columns successfully');
  } catch (error) {
    console.error('Error adding separate read status:', error);
    throw error;
  }
}

async function down() {
  try {
    await db.query(`
      ALTER TABLE chat_messages
      DROP COLUMN IF EXISTS admin_read,
      DROP COLUMN IF EXISTS seller_read,
      DROP COLUMN IF EXISTS user_read
    `);

    await db.query(`
      ALTER TABLE chat_rooms
      DROP COLUMN IF EXISTS admin_unread_count,
      DROP COLUMN IF EXISTS seller_unread_count,
      DROP COLUMN IF EXISTS user_unread_count
    `);

    console.log('Removed separate read status columns successfully');
  } catch (error) {
    console.error('Error removing separate read status:', error);
    throw error;
  }
}

module.exports = { up, down };
