const db = require('./db');

async function removeHistoryTable() {
  const connection = await db.getConnection();
  
  try {
    console.log('Starting table removal process...');
    
    // First, find any foreign keys referencing payment_history
    const [fks] = await connection.query(`
      SELECT 
        TABLE_NAME,
        CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_NAME = 'payment_history'
      AND TABLE_SCHEMA = 'motor_db'
    `);

    console.log('Found foreign keys:', fks);

    await connection.beginTransaction();

    // Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('Disabled foreign key checks');

    // Drop any foreign keys found
    for (const fk of fks) {
      await connection.query(`
        ALTER TABLE ${fk.TABLE_NAME}
        DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}
      `);
      console.log(`Dropped foreign key ${fk.CONSTRAINT_NAME} from ${fk.TABLE_NAME}`);
    }

    // Drop the payment_history table
    await connection.query('DROP TABLE IF EXISTS payment_history');
    console.log('Dropped payment_history table');

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Re-enabled foreign key checks');

    await connection.commit();
    console.log('Successfully removed payment_history table');
  } catch (error) {
    await connection.rollback();
    console.error('Error:', error);
  } finally {
    connection.release();
    process.exit();
  }
}

removeHistoryTable();
