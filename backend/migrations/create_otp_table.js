const db = require('../db');

async function up() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Create OTP table
    await connection.query(`
      CREATE TABLE otp (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        UNIQUE (email, otp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await connection.commit();
    console.log('Created OTP table');
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
    await connection.query('DROP TABLE IF EXISTS otp');
    await connection.commit();
    console.log('Dropped OTP table');
  } catch (error) {
    await connection.rollback();
    console.error('Error in migration rollback:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { up, down };
