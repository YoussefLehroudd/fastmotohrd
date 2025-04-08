const db = require('../db');

async function up() {
  try {
    // Drop existing users table
    await db.query('DROP TABLE IF EXISTS users');

    // Create new users table with updated schema
    await db.query(`
      CREATE TABLE users (
        id int(11) NOT NULL AUTO_INCREMENT,
        username varchar(255) NOT NULL,
        email varchar(255) NOT NULL,
        password varchar(255) NOT NULL,
        role enum('user','admin','seller') DEFAULT 'user',
        isBlocked tinyint(1) DEFAULT 0,
        isVerified tinyint(1) DEFAULT 0,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        phone varchar(20) DEFAULT NULL,
        address text DEFAULT NULL,
        bio text DEFAULT NULL,
        profileImageUrl varchar(255) DEFAULT NULL,
        countryCode varchar(10) DEFAULT '+212',
        PRIMARY KEY (id),
        UNIQUE KEY email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    console.log('Users table updated successfully');
  } catch (error) {
    console.error('Error updating users table:', error);
    throw error;
  }
}

async function down() {
  try {
    // Revert to original schema if needed
    await db.query('DROP TABLE IF EXISTS users');
    await db.query(`
      CREATE TABLE users (
        id int(11) NOT NULL AUTO_INCREMENT,
        username varchar(50) NOT NULL,
        email varchar(100) NOT NULL,
        password varchar(255) DEFAULT NULL,
        role enum('user','seller','admin') DEFAULT 'user',
        isBlocked tinyint(1) DEFAULT 0,
        isVerified tinyint(1) DEFAULT 0,
        google_id varchar(255) DEFAULT NULL,
        google_email varchar(100) DEFAULT NULL,
        last_login timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        login_count int(11) DEFAULT 0,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    console.log('Users table reverted successfully');
  } catch (error) {
    console.error('Error reverting users table:', error);
    throw error;
  }
}

module.exports = { up, down };
