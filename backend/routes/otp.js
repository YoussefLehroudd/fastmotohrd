const express = require('express');
const db = require('../db');
const crypto = require('crypto');
const router = express.Router();

// Generate OTP
router.post('/generate', async (req, res) => {
    const { email } = req.body;
    const otp = crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
    const expiresAt = new Date(Date.now() + 10 * 60000); // OTP valid for 10 minutes

    try {
        const connection = await db.getConnection();
        await connection.query('INSERT INTO otp (email, otp, expires_at) VALUES (?, ?, ?)', [email, otp, expiresAt]);
        // Here you would call the email service to send the OTP
        res.status(200).json({ message: 'OTP generated and sent to email.' });
    } catch (error) {
        console.error('Error generating OTP:', error);
        res.status(500).json({ message: 'Error generating OTP.' });
    }
});

// Validate OTP
router.post('/validate', async (req, res) => {
    const { email, otp } = req.body;

    try {
        const connection = await db.getConnection();
        const [rows] = await connection.query('SELECT * FROM otp WHERE email = ? AND otp = ? AND expires_at > NOW()', [email, otp]);

        if (rows.length > 0) {
            res.status(200).json({ message: 'OTP is valid.' });
        } else {
            res.status(400).json({ message: 'Invalid or expired OTP.' });
        }
    } catch (error) {
        console.error('Error validating OTP:', error);
        res.status(500).json({ message: 'Error validating OTP.' });
    }
});

module.exports = router;
