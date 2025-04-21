const { up } = require('./migrations/add_chat_tables');

(async () => {
  try {
    console.log('Running chat tables migration...');
    await up();
    console.log('Chat tables migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
