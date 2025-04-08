const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrateBooksLocations() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    // Add locationId column if it doesn't exist
    await connection.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS locationId INT,
      ADD FOREIGN KEY IF NOT EXISTS (locationId) REFERENCES motor_locations(id)
    `);

    // Get all bookings with old location format
    const [bookings] = await connection.query('SELECT id, motorId, location FROM bookings WHERE locationId IS NULL AND location IS NOT NULL');
    
    console.log(`Found ${bookings.length} bookings to migrate`);

    for (const booking of bookings) {
      // Split the old location string (assuming format "City - Address")
      const [city, ...addressParts] = booking.location.split(' - ');
      const address = addressParts.join(' - '); // Rejoin in case address contained ' - '

      // First, try to find an existing location
      const [existingLocations] = await connection.query(
        'SELECT id FROM motor_locations WHERE motorId = ? AND city = ? AND address = ?',
        [booking.motorId, city, address]
      );

      let locationId;
      if (existingLocations.length > 0) {
        // Use existing location
        locationId = existingLocations[0].id;
      } else {
        // Create new location
        const [result] = await connection.query(
          'INSERT INTO motor_locations (motorId, city, address) VALUES (?, ?, ?)',
          [booking.motorId, city, address]
        );
        locationId = result.insertId;
      }

      // Update booking with new locationId
      await connection.query(
        'UPDATE bookings SET locationId = ? WHERE id = ?',
        [locationId, booking.id]
      );

      console.log(`Migrated booking ${booking.id} to use locationId ${locationId}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migration
migrateBooksLocations().then(() => {
  console.log('Migration script finished');
  process.exit(0);
}).catch((error) => {
  console.error('Migration script failed:', error);
  process.exit(1);
});
