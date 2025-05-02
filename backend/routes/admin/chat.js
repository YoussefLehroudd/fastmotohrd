const express = require('express');
const router = express.Router();
const db = require('../../db');
const { authenticateAdmin } = require('../../middleware/auth');

// Get all chats with pagination
router.get('/chats', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get chats with user details and message counts
    const query = `
      SELECT 
        u.id,
        u.username,
        u.role,
        u.profileImageUrl,
        u.last_active,
        u.is_online as isOnline,
        COUNT(m.id) as messageCount
      FROM users u
      LEFT JOIN messages m ON (u.id = m.sender_id OR u.id = m.receiver_id)
      WHERE u.role != 'admin'
      GROUP BY u.id
      ORDER BY u.last_active DESC
      LIMIT ? OFFSET ?
    `;

    const [chats] = await db.query(query, [parseInt(limit), offset]);

    // Get total count
    const [totalCount] = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE role != "admin"'
    );

    res.json({
      chats,
      total: totalCount[0].count,
      page: parseInt(page),
      pages: Math.ceil(totalCount[0].count / limit)
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({
      message: 'Error fetching chats',
      error: error.message
    });
  }
});

module.exports = router;
