const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { authenticateAdmin } = require('../../middleware/auth');

// Get all subscription requests
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const [subscriptions] = await db.query(`
      SELECT ss.*, u.username as seller_name, sp.name as plan_name, sp.price, sp.duration_months
      FROM seller_subscriptions ss
      JOIN users u ON ss.seller_id = u.id
      JOIN subscription_plans sp ON ss.plan_id = sp.id
      ORDER BY ss.created_at DESC
    `);

    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Error fetching subscriptions', error: error.message });
  }
});

// Approve subscription request
router.post('/:id/approve', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get subscription details
    const [subscription] = await db.query(
      'SELECT * FROM seller_subscriptions WHERE id = ?',
      [id]
    );

    if (!subscription[0]) {
      throw new Error('Subscription not found');
    }

    // Get plan details
    const [plan] = await db.query(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [subscription[0].plan_id]
    );

    if (!plan[0]) {
      throw new Error('Plan not found');
    }

    // Calculate end date for non-unlimited plans
    let endDate = null;
    if (plan[0].duration_months > 0) {
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan[0].duration_months);
    }

    // Update subscription status
    await db.query(
      `UPDATE seller_subscriptions 
       SET status = 'active',
           start_date = CURRENT_TIMESTAMP,
           end_date = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [endDate, id]
    );

    res.json({ message: 'Subscription approved successfully' });
  } catch (error) {
    console.error('Error approving subscription:', error);
    res.status(500).json({ message: 'Error approving subscription', error: error.message });
  }
});

// Reject subscription request
router.post('/:id/reject', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    await db.query(
      `UPDATE seller_subscriptions 
       SET status = 'rejected',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );

    res.json({ message: 'Subscription rejected successfully' });
  } catch (error) {
    console.error('Error rejecting subscription:', error);
    res.status(500).json({ message: 'Error rejecting subscription', error: error.message });
  }
});

// Cancel subscription
router.post('/:id/cancel', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    await db.query(
      `UPDATE seller_subscriptions 
       SET status = 'cancelled',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ message: 'Error cancelling subscription', error: error.message });
  }
});

module.exports = router;
