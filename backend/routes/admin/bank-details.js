const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { verifyToken } = require('../../middleware/auth');

// Get bank details
router.get('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const [bankDetails] = await db.query('SELECT * FROM bank_details ORDER BY id DESC LIMIT 1');
    res.json(bankDetails[0] || null);
  } catch (error) {
    console.error('Error fetching bank details:', error);
    res.status(500).json({ message: 'Failed to fetch bank details' });
  }
});

// Update bank details
router.put('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const { bankName, accountNumber, beneficiary, whatsappNumber } = req.body;

  if (!bankName || !accountNumber || !beneficiary || !whatsappNumber) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    await db.query(`
      INSERT INTO bank_details (bank_name, account_number, beneficiary, whatsapp_number)
      VALUES (?, ?, ?, ?)`,
      [bankName, accountNumber, beneficiary, whatsappNumber]
    );

    res.json({ message: 'Bank details updated successfully' });
  } catch (error) {
    console.error('Error updating bank details:', error);
    res.status(500).json({ message: 'Failed to update bank details' });
  }
});

module.exports = router;
