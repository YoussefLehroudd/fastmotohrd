const { up } = require('./migrations/modify_users_table');

async function runMigration() {
  try {
    await up();
    console.log('Users table migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
