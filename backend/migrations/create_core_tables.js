const db = require('../db');

async function up() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Drop existing tables
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS bookings');
    await connection.query('DROP TABLE IF EXISTS motors');
    await connection.query('DROP TABLE IF EXISTS users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create users table
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255),
        role ENUM('user', 'seller', 'admin') DEFAULT 'user',
        isBlocked BOOLEAN DEFAULT false,
        isVerified BOOLEAN DEFAULT false,
        google_id VARCHAR(255),
        google_email VARCHAR(100),
        last_login TIMESTAMP,
        login_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create motors table
    await connection.query(`
      CREATE TABLE motors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sellerId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        price DECIMAL(10,2) DEFAULT NULL,
        imageUrl VARCHAR(255) DEFAULT NULL,
        dailyRate DECIMAL(10,2) DEFAULT NULL,
        isAvailableForRent BOOLEAN DEFAULT true,
        motorType ENUM('sport','cruiser','touring','dirt','scooter','other') NOT NULL,
        brand VARCHAR(100) DEFAULT NULL,
        model VARCHAR(100) DEFAULT NULL,
        year INT DEFAULT NULL,
        isActive BOOLEAN DEFAULT false,
        capacity INT DEFAULT NULL,
        seats INT DEFAULT 2,
        status ENUM('available','rented','maintenance','unavailable') DEFAULT 'available',
        features TEXT DEFAULT NULL,
        licensePlate VARCHAR(20) DEFAULT NULL,
        mileage INT DEFAULT NULL,
        maintenanceDate DATE DEFAULT NULL,
        insuranceExpiryDate DATE DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sellerId) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create bookings table
    await connection.query(`
      CREATE TABLE bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        motorId INT NOT NULL,
        userId INT NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
        totalAmount DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (motorId) REFERENCES motors(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create initial admin users
    await connection.query(`
      INSERT INTO users (username, email, role, isVerified) VALUES
      ('admin', 'f5mdesigner01@gmail.com', 'admin', true),
      ('admin2', 'admin@example.com', 'admin', true)
    `);

    await connection.commit();
    console.log('Created core tables: users, motors, bookings');
  } catch (error) {
    await connection.rollback();
    console.error('Error in migration:', error);
    throw error;
  } finally {
    connection.release();
  }
}

async function down() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS bookings');
    await connection.query('DROP TABLE IF EXISTS motors');
    await connection.query('DROP TABLE IF EXISTS users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.commit();
    console.log('Dropped core tables');
  } catch (error) {
    await connection.rollback();
    console.error('Error in migration rollback:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { up, down };
