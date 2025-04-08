const db = require('./db');
const bcrypt = require('bcrypt');

async function updateAdmin() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Update admin password to 'admin123'
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(`
      UPDATE users 
      SET password = ?
      WHERE username = 'admin' AND role = 'admin'
    `, [hashedPassword]);

    await connection.commit();
    console.log('Updated admin password successfully');
    process.exit(0);
  } catch (error) {
    await connection.rollback();
    console.error('Failed to update admin password:', error);
    process.exit(1);
  } finally {
    connection.release();
  }
}

updateAdmin();
