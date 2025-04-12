const db = require('../db');

async function up() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Modify motorType ENUM to include all motorcycle categories
    await connection.query(`
      ALTER TABLE motors 
      MODIFY COLUMN motorType ENUM(
        'Sport',
        'Cruiser', 
        'Touring',
        'Adventure',
        'Scooter',
        'Standard',
        'Dirt',
        'Electric',
        'Naked',
        'Custom'
      ) NOT NULL DEFAULT 'Standard'
    `);

    await connection.commit();
    console.log('Updated motor types');
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
    
    // Revert back to original motor types
    await connection.query(`
      ALTER TABLE motors 
      MODIFY COLUMN motorType ENUM('sport','cruiser','touring','dirt','scooter','other') NOT NULL
    `);

    await connection.commit();
    console.log('Reverted motor types');
  } catch (error) {
    await connection.rollback();
    console.error('Error in migration rollback:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { up, down };
