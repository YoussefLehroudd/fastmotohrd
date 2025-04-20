const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyTokenOptional } = require('../middleware/auth'); // Middleware to optionally verify user token

// Record or update user session with browser info
router.post('/session', verifyTokenOptional, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { browser, userAgent } = req.body;

    if (!browser || !userAgent) {
      return res.status(400).json({ message: 'Browser and userAgent are required' });
    }

    // Insert or update session record
    await db.query(`
      INSERT INTO user_sessions (userId, browser, userAgent, lastActive)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        browser = VALUES(browser),
        userAgent = VALUES(userAgent),
        lastActive = NOW()
    `, [userId, browser, userAgent]);

    res.json({ message: 'Session recorded' });
  } catch (error) {
    console.error('Error recording session:', error);
    res.status(500).json({ message: 'Error recording session', error: error.message });
  }
});

// Record page view
router.post('/pageview', verifyTokenOptional, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    // Check if this page view already exists in the same second
    const [existing] = await db.query(`
      SELECT * FROM page_views 
      WHERE userId = ? AND page_url = ? 
        AND ABS(TIMESTAMPDIFF(SECOND, viewedAt, NOW())) < 2
    `, [userId, url]);

    if (existing.length === 0) {
      await db.query(`
        INSERT INTO page_views (userId, page_url, viewedAt)
        VALUES (?, ?, NOW())
      `, [userId, url]);
    }

    res.json({ message: 'Page view recorded (or skipped duplicate)' });
  } catch (error) {
    console.error('Error recording page view:', error);
    res.status(500).json({ message: 'Error recording page view', error: error.message });
  }
});


module.exports = router;
