const db = require('./db');

async function testMotors() {
  try {
    // First check raw bookings data
    console.log('\nChecking bookings table:');
    const [bookings] = await db.query(
      `SELECT id, motorId, status, returnTime, endDate
       FROM bookings 
       WHERE status = 'confirmed'
       ORDER BY motorId, endDate DESC`
    );
    console.log('Current bookings:', bookings);

    // Then check motors with their booking info
    console.log('\nChecking motors with booking info:');
    const [motors] = await db.query(
      `SELECT m.id, m.title,
        b.returnTime,
        b.status as booking_status,
        TIME_FORMAT(b.returnTime, '%h:%i %p') as formatted_return_time
       FROM motors m
       LEFT JOIN bookings b ON m.id = b.motorId 
       WHERE b.status = 'confirmed'
       AND b.endDate >= CURDATE()`
    );
    console.log('Motors with return times:', motors);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testMotors();
