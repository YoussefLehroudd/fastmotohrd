const db = require('../db');

async function up() {
  try {
    // First get a seller's motor and a user
    const [sellers] = await db.query('SELECT id FROM users WHERE role = "seller" LIMIT 1');
    const [users] = await db.query('SELECT id FROM users WHERE role = "user" LIMIT 1');
    
    if (sellers.length === 0 || users.length === 0) {
      console.log('No sellers or users found. Please create users first.');
      return;
    }

    const sellerId = sellers[0].id;
    const userId = users[0].id;

    // Create a motor if none exists
    const [motors] = await db.query('SELECT id FROM motors WHERE sellerId = ? LIMIT 1', [sellerId]);
    let motorId;

    if (motors.length === 0) {
      const [result] = await db.query(
        'INSERT INTO motors (sellerId, title, brand, model, price, dailyRate) VALUES (?, ?, ?, ?, ?, ?)',
        [sellerId, 'Test Motor', 'Honda', 'CBR', 5000, 50]
      );
      motorId = result.insertId;
    } else {
      motorId = motors[0].id;
    }

    // Create a booking
    const [booking] = await db.query(
      'INSERT INTO bookings (userId, motorId, startDate, endDate, totalAmount, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, motorId, '2024-01-01', '2024-01-07', 350, 'confirmed']
    );

    // Add sample payments
    const payments = [
      {
        bookingId: booking.insertId,
        amount: 251.00,
        paymentType: 'rental',
        status: 'pending',
        created_at: '2024-01-01 10:00:00'
      },
      {
        bookingId: booking.insertId,
        amount: 99.00,
        paymentType: 'deposit',
        status: 'paid',
        created_at: '2024-01-02 15:30:00'
      },
      {
        bookingId: booking.insertId,
        amount: 150.00,
        paymentType: 'rental',
        status: 'paid',
        created_at: '2024-01-03 09:15:00'
      }
    ];

    for (const payment of payments) {
      await db.query(
        `INSERT INTO payments 
         (bookingId, amount, paymentType, status, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [payment.bookingId, payment.amount, payment.paymentType, payment.status, payment.created_at]
      );
    }

    console.log('Sample payments added successfully');
  } catch (error) {
    console.error('Error adding sample payments:', error);
    throw error;
  }
}

async function down() {
  // No down migration needed for sample data
}

module.exports = { up, down };
