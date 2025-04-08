const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all public motors with current booking status
router.get('/public', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get motors with their current booking status
    const [motors] = await db.query(
      `SELECT m.*, 
        b.endDate as available_after,
        CASE 
          WHEN b.id IS NOT NULL AND b.status = 'confirmed' THEN 'booked'
          ELSE 'available'
        END as current_status
      FROM motors m
      LEFT JOIN (
        SELECT motorId, endDate, status, id
        FROM bookings 
        WHERE status = 'confirmed'
        AND startDate <= ?
        AND endDate >= ?
      ) b ON m.id = b.motorId
      WHERE m.isActive = 1`,
      [today, today]
    );

    res.json(motors);
  } catch (error) {
    console.error('Error fetching motors:', error);
    res.status(500).json({ message: 'Error fetching motors' });
  }
});

// Get specific motor details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const [motor] = await db.query(
      `SELECT m.*, 
        b.endDate as available_after,
        CASE 
          WHEN b.id IS NOT NULL AND b.status = 'confirmed' THEN 'booked'
          ELSE 'available'
        END as current_status
      FROM motors m
      LEFT JOIN (
        SELECT motorId, endDate, status, id
        FROM bookings 
        WHERE status = 'confirmed'
        AND startDate <= ?
        AND endDate >= ?
      ) b ON m.id = b.motorId
      WHERE m.id = ?`,
      [today, today, id]
    );

    if (!motor.length) {
      return res.status(404).json({ message: 'Motor not found' });
    }

    res.json(motor[0]);
  } catch (error) {
    console.error('Error fetching motor:', error);
    res.status(500).json({ message: 'Error fetching motor' });
  }
});

module.exports = router;
