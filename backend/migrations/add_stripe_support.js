const db = require('../db');

async function up() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Modify payments table to add Stripe fields
    await connection.query(`
      ALTER TABLE payments 
      MODIFY COLUMN paymentMethod ENUM('cash_on_delivery', 'bank_transfer', 'stripe') DEFAULT 'cash_on_delivery',
      ADD COLUMN stripePaymentIntentId VARCHAR(255) NULL,
      ADD COLUMN stripeClientSecret VARCHAR(255) NULL,
      ADD COLUMN stripeCustomerId VARCHAR(255) NULL,
      ADD COLUMN stripeChargeId VARCHAR(255) NULL
    `);

    await connection.commit();
    console.log('Added Stripe payment support to payments table');
  } catch (error) {
    await connection.rollback();
    console.error('Error in migration:', error);
    throw error;
  } finally {
    connection.release();
  }
}

async function down() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Revert changes
    await connection.query(`
      ALTER TABLE payments 
      MODIFY COLUMN paymentMethod ENUM('cash_on_delivery', 'bank_transfer') DEFAULT 'cash_on_delivery',
      DROP COLUMN stripePaymentIntentId,
      DROP COLUMN stripeClientSecret,
      DROP COLUMN stripeCustomerId,
      DROP COLUMN stripeChargeId
    `);

    await connection.commit();
    console.log('Removed Stripe payment fields');
  } catch (error) {
    await connection.rollback();
    console.error('Error in down migration:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { up, down };
