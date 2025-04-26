const db = require('../db');

async function up() {
  try {
    // Drop the foreign key constraint
    await db.query(`
      ALTER TABLE chat_messages 
      DROP FOREIGN KEY chat_messages_ibfk_3
    `);
    
    // Drop the column
    await db.query(`
      ALTER TABLE chat_messages 
      DROP COLUMN reply_to_message_id
    `);

    console.log('Successfully dropped reply_to_message_id constraint and column');
  } catch (error) {
    console.error('Error dropping reply constraint:', error);
    throw error;
  }
}

async function down() {
  try {
    // Add back the column and constraint if needed
    await db.query(`
      ALTER TABLE chat_messages 
      ADD COLUMN reply_to_message_id INT,
      ADD CONSTRAINT chat_messages_ibfk_3 
      FOREIGN KEY (reply_to_message_id) 
      REFERENCES chat_messages(id)
    `);
    console.log('Successfully restored reply_to_message_id column and constraint');
  } catch (error) {
    console.error('Error restoring reply constraint:', error);
    throw error;
  }
}

module.exports = { up, down };
