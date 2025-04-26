const { up: dropReplyConstraint } = require('./migrations/drop_reply_constraint');

async function runMigration() {
  try {
    await dropReplyConstraint();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
