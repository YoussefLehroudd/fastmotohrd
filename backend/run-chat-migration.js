const { up: addChatTables } = require('./migrations/add_chat_tables');
const { up: addUnreadCount } = require('./migrations/add_unread_count_to_chat_rooms');
const { up: addAdminMessagesCount } = require('./migrations/add_admin_messages_count');
const db = require('./db');

async function columnExists(table, column) {
  const [columns] = await db.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = ? AND COLUMN_NAME = ?
  `, [table, column]);
  return columns.length > 0;
}

async function runMigrations() {
  try {
    console.log('Starting chat migrations...');
    
    // Create chat tables
    await addChatTables();
    console.log('Chat tables created/verified successfully');
    
    // Add unread_count column if it doesn't exist
    const hasUnreadCount = await columnExists('chat_rooms', 'unread_count');
    if (!hasUnreadCount) {
      await addUnreadCount();
      console.log('Added unread_count column');
    } else {
      console.log('unread_count column already exists');
    }
    
    // Add admin_messages_count column if it doesn't exist
    const hasAdminMessagesCount = await columnExists('chat_rooms', 'admin_messages_count');
    if (!hasAdminMessagesCount) {
      await addAdminMessagesCount();
      console.log('Added admin_messages_count column');
    } else {
      console.log('admin_messages_count column already exists');
    }
    
    console.log('All chat migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
