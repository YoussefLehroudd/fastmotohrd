const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// Helper function to send notification via WebSocket
const sendNotificationToUser = (req, userId, notification) => {
  const wss = req.app.get('wss');
  const clients = req.app.get('wsClients');
  const ws = clients.get(userId);
  
  if (ws) {
    ws.send(JSON.stringify({
      type: 'notification',
      data: notification
    }));
  }
};

// Create notification and send via WebSocket
const createNotification = async (req, userId, content, priority = 'low') => {
  const [result] = await db.query(
    'INSERT INTO notifications (userId, content, priority) VALUES (?, ?, ?)',
    [userId, content, priority]
  );

  const [notification] = await db.query(
    'SELECT * FROM notifications WHERE id = ?',
    [result.insertId]
  );

  if (notification.length > 0) {
    sendNotificationToUser(req, userId, notification[0]);
    return notification[0];
  }
  return null;
};

// Get user notifications
router.get('/', verifyToken, async (req, res) => {
  try {
    const [notifications] = await db.query(
      'SELECT * FROM notifications WHERE userId = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    // Get unread count
    const [unreadCount] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = FALSE',
      [req.user.id]
    );

    res.json({
      notifications,
      unreadCount: unreadCount[0].count
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify notification belongs to user
    const [notification] = await db.query(
      'SELECT id FROM notifications WHERE id = ? AND userId = ?',
      [id, req.user.id]
    );

    if (!notification.length) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await db.query(
      'UPDATE notifications SET isRead = TRUE WHERE id = ?',
      [id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// Mark all notifications as read
router.patch('/read-all', verifyToken, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET isRead = TRUE WHERE userId = ?',
      [req.user.id]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

// Delete notification
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify notification belongs to user
    const [notification] = await db.query(
      'SELECT id FROM notifications WHERE id = ? AND userId = ?',
      [id, req.user.id]
    );

    if (!notification.length) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await db.query(
      'DELETE FROM notifications WHERE id = ?',
      [id]
    );

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

// Delete all notifications
router.delete('/delete-all', verifyToken, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM notifications WHERE userId = ?',
      [req.user.id]
    );

    res.json({ message: 'All notifications deleted' });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ message: 'Error deleting notifications' });
  }
});

module.exports = router;
