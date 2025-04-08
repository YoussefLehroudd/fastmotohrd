const db = require('./db');

async function checkDatabase() {
  try {
    // List all tables
    const [tables] = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'motor_db'
    `);
    
    console.log('Tables in database:');
    for (const table of tables) {
      console.log(table.table_name);
    }

    // Check if payment_history exists and show its structure
    const [paymentHistoryExists] = await db.query(`
      SELECT COUNT(*) as exists_count
      FROM information_schema.tables 
      WHERE table_schema = 'motor_db' 
      AND table_name = 'payment_history'
    `);

    if (paymentHistoryExists[0].exists_count > 0) {
      console.log('\npayment_history table exists and needs to be removed');
    } else {
      console.log('\npayment_history table does not exist');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkDatabase();
