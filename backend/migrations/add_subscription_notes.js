const mysql = require('mysql2/promise');
const db = require('../config/db');

async function up() {
  const connection = await mysql.createConnection(db);
  try {
    await connection.query(`
      ALTER TABLE seller_subscriptions
      ADD COLUMN notes TEXT NULL AFTER status;
    `);
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function down() {
  const connection = await mysql.createConnection(db);
  try {
    await connection.query(`
      ALTER TABLE seller_subscriptions
      DROP COLUMN notes;
    `);
  } catch (error) {
    console.error('Migration rollback error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

module.exports = { up, down };
