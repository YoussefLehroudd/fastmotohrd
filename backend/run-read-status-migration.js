const { up: addSeparateReadStatus } = require('./migrations/add_separate_read_status');

async function runMigration() {
  try {
    await addSeparateReadStatus();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
