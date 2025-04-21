const db = require('../db');

async function up() {
  try {
    // Create chat_rooms table
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_type ENUM('user', 'seller') NOT NULL,
        status ENUM('active', 'closed') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create chat_messages table
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT NOT NULL,
        sender_id INT NOT NULL,
        sender_type ENUM('user', 'seller', 'admin') NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Chat tables created successfully');
  } catch (error) {
    console.error('Error creating chat tables:', error);
    throw error;
  }
}

async function down() {
  try {
    await db.query('DROP TABLE IF EXISTS chat_messages');
    await db.query('DROP TABLE IF EXISTS chat_rooms');
    console.log('Chat tables dropped successfully');
  } catch (error) {
    console.error('Error dropping chat tables:', error);
    throw error;
  }
}

module.exports = { up, down };
