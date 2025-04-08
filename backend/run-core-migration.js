const { up: createCoreTables } = require('./migrations/create_core_tables');

async function runMigration() {
  try {
    await createCoreTables();
    console.log('Core migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Core migration failed:', error);
    process.exit(1);
  }
}

runMigration();
