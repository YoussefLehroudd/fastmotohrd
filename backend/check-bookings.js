const db = require('./db');

async function checkBookings() {
  try {
    const [rows] = await db.query(
      'SELECT motorId, returnTime FROM bookings WHERE status = "confirmed"'
    );
    console.log('Bookings with return times:', rows);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBookings();
