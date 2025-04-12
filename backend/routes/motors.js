// const express = require('express');
// const router = express.Router();
// const db = require('../db');

// // Get all public motors with current booking status
// router.get('/public', async (req, res) => {
//   try {
//     // Get motors with their current booking status and brand info
//     const [motors] = await db.query(
//       `SELECT m.*, 
//         b.endDate as available_after,
//         CASE 
//           WHEN b.id IS NOT NULL AND b.endDate > NOW() AND b.status = 'confirmed' THEN 'booked'
//           ELSE 'available'
//         END as current_status,
//         m.brand,
//         m.model,
//         CASE WHEN b.returnTime IS NOT NULL THEN
//           CONCAT(
//             CASE 
//               WHEN HOUR(b.returnTime) > 12 
//               THEN HOUR(b.returnTime) - 12 
//               WHEN HOUR(b.returnTime) = 0 
//               THEN 12
//               ELSE HOUR(b.returnTime)
//             END,
//             ':',
//             LPAD(MINUTE(b.returnTime), 2, '0'),
//             ' ',
//             CASE WHEN HOUR(b.returnTime) >= 12 THEN 'PM' ELSE 'AM' END
//           )
//         END as returnTime
//       FROM motors m
//       LEFT JOIN bookings b ON m.id = b.motorId AND b.status = 'confirmed'
//       WHERE m.isActive = 1
//       AND (b.id IS NULL OR b.id = (
//         SELECT b2.id
//         FROM bookings b2
//         WHERE b2.motorId = m.id
//         AND b2.status = 'confirmed'
//         ORDER BY b2.startDate DESC
//         LIMIT 1
//       ))`
//     );

//     res.json(motors);
//   } catch (error) {
//     console.error('Error fetching motors:', error);
//     res.status(500).json({ message: 'Error fetching motors' });
//   }
// });

// // Get specific motor details
// router.get('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const [motor] = await db.query(
//       `SELECT m.*, 
//         b.endDate as available_after,
//         CASE 
//           WHEN b.id IS NOT NULL AND b.endDate > NOW() AND b.status = 'confirmed' THEN 'booked'
//           ELSE 'available'
//         END as current_status,
//         CASE WHEN b.returnTime IS NOT NULL THEN
//           CONCAT(
//             CASE 
//               WHEN HOUR(b.returnTime) > 12 
//               THEN HOUR(b.returnTime) - 12 
//               WHEN HOUR(b.returnTime) = 0 
//               THEN 12
//               ELSE HOUR(b.returnTime)
//             END,
//             ':',
//             LPAD(MINUTE(b.returnTime), 2, '0'),
//             ' ',
//             CASE WHEN HOUR(b.returnTime) >= 12 THEN 'PM' ELSE 'AM' END
//           )
//         END as returnTime
//       FROM motors m
//       LEFT JOIN bookings b ON m.id = b.motorId AND b.status = 'confirmed'
//       WHERE m.id = ?
//       AND (b.id IS NULL OR b.id = (
//         SELECT b2.id
//         FROM bookings b2
//         WHERE b2.motorId = m.id
//         AND b2.status = 'confirmed'
//         ORDER BY b2.startDate DESC
//         LIMIT 1
//       ))`,
//       [id]
//     );

//     if (!motor.length) {
//       return res.status(404).json({ message: 'Motor not found' });
//     }

//     res.json(motor[0]);
//   } catch (error) {
//     console.error('Error fetching motor:', error);
//     res.status(500).json({ message: 'Error fetching motor' });
//   }
// });

// module.exports = router;
