const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [countries] = await db.query('SELECT DISTINCT * FROM countries ORDER BY name');
    res.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ message: 'Error fetching countries' });
  }
});

module.exports = router;
