const db = require('./db');

async function checkPaymentsStructure() {
  try {
    console.log('Checking payments table structure...');
    
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'motor_db'
      AND TABLE_NAME = 'payments'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\nPayments Table Columns:');
    columns.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    const [constraints] = await db.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'motor_db'
      AND TABLE_NAME = 'payments'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    console.log('\nForeign Keys:');
    constraints.forEach(constraint => {
      console.log(`${constraint.CONSTRAINT_NAME}: ${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}(${constraint.REFERENCED_COLUMN_NAME})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkPaymentsStructure();
