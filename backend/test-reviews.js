const axios = require('axios');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testReviews() {
  try {
    // First get the seller's ID
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'motor_db'
    });

    const [sellers] = await conn.execute(
      'SELECT id FROM users WHERE id = (SELECT sellerId FROM motors WHERE id = 1)'
    );
    await conn.end();

    if (sellers.length === 0) {
      throw new Error('Seller not found');
    }

    // Create JWT token for seller
    const sellerToken = jwt.sign(
      { id: sellers[0].id, role: 'seller' },
      process.env.JWT_SECRET || 'your-secret-key'
    );

    console.log('Created seller token:', sellerToken);

    // Add seller response to the review
    const responseRes = await axios.post(
      'http://localhost:5000/api/reviews/18/response',
      {
        response: 'Thank you for your review! We appreciate your feedback.'
      },
      {
        headers: {
          'Authorization': `Bearer ${sellerToken}`
        }
      }
    );

    console.log('Seller response added:', responseRes.data);

    // Get the reviews to verify
    const getRes = await axios.get('http://localhost:5000/api/reviews/1');
    console.log('Get reviews response:', getRes.data);

  } catch (error) {
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Status code:', error.response.status);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testReviews();
