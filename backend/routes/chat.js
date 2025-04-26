const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, authenticateAdmin } = require('../middleware/auth');
const { getIO } = require('../utils/socketService');

// Get chat history for a user
router.get('/history', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role === 'admin' ? 'admin' : req.user.role;

    let rooms;
    if (userType === 'admin') {
      // Admin can see all chat rooms with message counts
      [rooms] = await db.query(`
        SELECT 
          cr.*,
          u.username as user_name,
          u.email as user_email,
          (SELECT COUNT(*) 
           FROM chat_messages cm 
           WHERE cm.room_id = cr.id 
           AND cm.sender_type != 'admin'
           AND cm.admin_read = false) as unread_count,
          (SELECT COUNT(*) 
           FROM chat_messages cm 
           WHERE cm.room_id = cr.id 
           AND cm.sender_type = 'admin') as messages_sent,
          (SELECT COUNT(*) 
           FROM chat_messages cm 
           WHERE cm.room_id = cr.id 
           AND cm.sender_type != 'admin') as messages_received
        FROM chat_rooms cr
        JOIN users u ON cr.user_id = u.id
        ORDER BY cr.updated_at DESC
      `);
    } else {
      // Users/sellers see only their own chats
      [rooms] = await db.query(`
        SELECT 
          cr.*,
          u.username as user_name,
          u.email as user_email,
          (SELECT COUNT(*) 
           FROM chat_messages cm 
           WHERE cm.room_id = cr.id 
           AND cm.sender_type = 'admin'
           AND cm.${userType}_read = false) as unread_count
        FROM chat_rooms cr
        JOIN users u ON cr.user_id = u.id
        WHERE cr.user_id = ? AND cr.user_type = ?
        ORDER BY cr.updated_at DESC
      `, [userId, userType]);
    }

    // Get messages for each room
    for (let room of rooms) {
      const [messages] = await db.query(`
        SELECT cm.*, u.username as sender_name
        FROM chat_messages cm
        JOIN users u ON cm.sender_id = u.id
        WHERE room_id = ?
        ORDER BY created_at ASC
      `, [room.id]);
      room.messages = messages;
    }

    res.json(rooms);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Error fetching chat history' });
  }
});

// Create new chat room
router.post('/room', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;

    if (userType === 'admin') {
      return res.status(403).json({ message: 'Admins cannot create chat rooms' });
    }

    // Check if active room already exists
    const [existingRoom] = await db.query(`
      SELECT * FROM chat_rooms 
      WHERE user_id = ? AND user_type = ? AND status = 'active'
    `, [userId, userType]);

    if (existingRoom.length > 0) {
      const [messages] = await db.query(`
        SELECT cm.*, u.username as sender_name
        FROM chat_messages cm
        JOIN users u ON cm.sender_id = u.id
        WHERE room_id = ?
        ORDER BY created_at ASC
      `, [existingRoom[0].id]);

      return res.json({
        ...existingRoom[0],
        messages
      });
    }

    // Create new room
    const [result] = await db.query(`
      INSERT INTO chat_rooms (user_id, user_type) 
      VALUES (?, ?)
    `, [userId, userType]);

    res.json({ 
      id: result.insertId, 
      user_id: userId, 
      user_type: userType, 
      status: 'active',
      messages: []
    });
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ message: 'Error creating chat room' });
  }
});

// Close chat room
router.put('/room/:id/close', authenticateAdmin, async (req, res) => {
  try {
    await db.query(`
      UPDATE chat_rooms SET status = 'closed'
      WHERE id = ?
    `, [req.params.id]);

    res.json({ message: 'Chat room closed successfully' });
  } catch (error) {
    console.error('Error closing chat room:', error);
    res.status(500).json({ message: 'Error closing chat room' });
  }
});

// Mark messages as read
router.put('/messages/read', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;
    const userType = req.user.role;

    if (userType === 'admin') {
      // Mark user/seller messages as read for admin
      await db.query(`
        UPDATE chat_messages 
        SET admin_read = TRUE
        WHERE room_id = ? AND sender_type != 'admin'
      `, [roomId]);
    } else {
      const io = getIO();
      
      // Mark admin messages as read for user/seller
      await db.query(`
        UPDATE chat_messages 
        SET ${userType}_read = TRUE
        WHERE room_id = ? AND sender_type = 'admin'
      `, [roomId]);

      // Get updated unread count
      const [unreadResult] = await db.query(`
        SELECT COUNT(*) as count 
        FROM chat_messages 
        WHERE room_id = ? 
        AND sender_type = 'admin' 
        AND ${userType}_read = false
      `, [roomId]);

      // Notify admin that messages are read
      const [room] = await db.query('SELECT user_id FROM chat_rooms WHERE id = ?', [roomId]);
      if (room.length > 0) {
        io.to('admin_room').emit('messages_read_by_user', { 
          roomId,
          userId: userId,
          unreadCount: unreadResult[0].count
        });
      }
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read' });
  }
});

module.exports = router;
