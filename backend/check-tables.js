const db = require('./db');

async function checkTables() {
  try {
    const [tables] = await db.query('SHOW TABLES');
    console.log('Database Tables:');
    tables.forEach(table => {
      console.log(Object.values(table)[0]);
    });
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    process.exit();
  }
}

checkTables();
