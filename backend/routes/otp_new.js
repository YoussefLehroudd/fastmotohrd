const express = require('express');
const db = require('../db');
const { generateOTP, sendLoginOTP } = require('../utils/emailService');
const router = express.Router();

// Generate OTP
router.post('/generate', async (req, res) => {
    const { email } = req.body;
    const otp = generateOTP(); // Use the existing generateOTP function
    const expiresAt = new Date(Date.now() + 10 * 60000); // OTP valid for 10 minutes

    try {
        const connection = await db.getConnection();
        
        // Delete any existing OTP for this email
        await connection.query('DELETE FROM otp WHERE email = ?', [email]);
        
        // Insert new OTP
        await connection.query('INSERT INTO otp (email, otp, expires_at) VALUES (?, ?, ?)', [email, otp, expiresAt]);
        
        // Send OTP via email
        await sendLoginOTP(email, otp);
        
        connection.release();
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
        const [rows] = await connection.query(
            'SELECT * FROM otp WHERE email = ? AND otp = ? AND expires_at > NOW()', 
            [email, otp]
        );

        if (rows.length > 0) {
            // Delete the used OTP
            await connection.query('DELETE FROM otp WHERE email = ? AND otp = ?', [email, otp]);
            connection.release();
            res.status(200).json({ message: 'OTP is valid.' });
        } else {
            connection.release();
            res.status(400).json({ message: 'Invalid or expired OTP.' });
        }
    } catch (error) {
        console.error('Error validating OTP:', error);
        res.status(500).json({ message: 'Error validating OTP.' });
    }
});

// Resend OTP
router.post('/resend', async (req, res) => {
    const { email } = req.body;
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes expiry

    try {
        const connection = await db.getConnection();
        
        // Delete existing OTP
        await connection.query('DELETE FROM otp WHERE email = ?', [email]);
        
        // Insert new OTP
        await connection.query('INSERT INTO otp (email, otp, expires_at) VALUES (?, ?, ?)', [email, otp, expiresAt]);
        
        // Send new OTP via email
        await sendLoginOTP(email, otp);
        
        connection.release();
        res.status(200).json({ message: 'New OTP sent successfully.' });
    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({ message: 'Error resending OTP.' });
    }
});

module.exports = router;
