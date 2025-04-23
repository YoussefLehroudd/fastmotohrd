const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('../db');

let io;
const connectedUsers = new Map();
const userStatuses = new Map();

const getUserStatus = (userId) => {
  return userStatuses.get(userId) || {
    online: false,
    lastActive: null
  };
};

const updateUserStatus = (userId, isOnline) => {
  if (!userId) return;
  
  const status = {
    online: isOnline,
    lastActive: isOnline ? null : new Date()
  };
  userStatuses.set(userId, status);
  io.emit('user_status_change', { userId, status });
};

const initializeSocket = (socketIo) => {
  io = socketIo;

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) {
        return next(new Error('Authentication required'));
      }

      const token = cookies.split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', handleConnection);
};

const handleConnection = async (socket) => {
  const userId = socket.user.id;
  console.log('User connected:', userId);

  // Store connection and update status
  connectedUsers.set(userId, socket);
  updateUserStatus(userId, true);

  // Join user's room
  const userRoom = `user_${userId}`;
  socket.join(userRoom);

  // Join admin room if admin
  if (socket.user.role === 'admin') {
    socket.join('admin_room');
  }

  // Handle marking messages as read
  socket.on('mark_messages_read', async (data) => {
    try {
      const { roomId } = data;
      const userId = socket.user.id;
      const userType = socket.user.role;

      if (userType === 'admin') {
        // Mark seller messages as read
        await db.query(
          'UPDATE chat_messages SET is_read = true WHERE room_id = ? AND sender_type = ?',
          [roomId, 'seller']
        );

        // Get updated unread count
        const [unreadResult] = await db.query(`
          SELECT COUNT(*) as count 
          FROM chat_messages 
          WHERE room_id = ? 
          AND sender_type = 'seller' 
          AND is_read = false
        `, [roomId]);

        // Emit updated unread count to all admins
        io.to('admin_room').emit('unread_count_updated', {
          roomId,
          unreadCount: unreadResult[0].count
        });

        // Notify seller that admin messages are read
        const [room] = await db.query('SELECT user_id FROM chat_rooms WHERE id = ?', [roomId]);
        if (room.length > 0) {
          io.to(`user_${room[0].user_id}`).emit('admin_messages_read', { roomId });
        }
      } else {
        await db.query(
          'UPDATE chat_messages SET is_read = true WHERE room_id = ? AND sender_type = ?',
          [roomId, 'admin']
        );
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Handle unread messages request
  socket.on('get_unread_messages', async ({ roomId }) => {
    try {
      const [messages] = await db.query(
        'SELECT m.*, u.username as sender_name FROM chat_messages m JOIN users u ON m.sender_id = u.id WHERE m.room_id = ? AND m.is_read = false ORDER BY m.created_at ASC',
        [roomId]
      );
      if (messages.length > 0) {
        socket.emit('unread_messages', messages);
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  });

  // Handle status request
  socket.on('get_user_status', ({ userId: requestedUserId }) => {
    const status = userStatuses.get(requestedUserId) || {
      online: false,
      lastActive: null
    };
    socket.emit('user_status_change', { userId: requestedUserId, status });
  });

  // Handle new message
  socket.on('send_message', async (data) => {
    try {
      const { roomId, message } = data;
      if (!roomId || !message) {
        throw new Error('Room ID and message are required');
      }

      const userId = socket.user.id;
      const userType = socket.user.role;

      // Save message to database and mark as unread
      const [result] = await db.query(`
        INSERT INTO chat_messages (room_id, sender_id, sender_type, message, is_read)
        VALUES (?, ?, ?, ?, false)
      `, [roomId, userId, userType, message]);

      // Get unread count for this room
      const [unreadCount] = await db.query(`
        SELECT COUNT(*) as count
        FROM chat_messages
        WHERE room_id = ?
        AND sender_type = 'seller'
        AND is_read = false
      `, [roomId]);

      // Get sender info
      const [sender] = await db.query(
        'SELECT username FROM users WHERE id = ?',
        [userId]
      );

      const messageData = {
        id: result.insertId,
        room_id: roomId,
        sender_id: userId,
        sender_type: userType,
        sender_name: sender[0].username,
        message: message,
        created_at: new Date(),
        is_read: false
      };

      // Get room info to determine recipients
      const [room] = await db.query(
        'SELECT user_id, user_type FROM chat_rooms WHERE id = ?',
        [roomId]
      );

      if (room.length > 0) {
      if (userType === 'admin') {
        // Admin message goes to user/seller as unread and shows in admin's view
        await Promise.all([
          // Mark message as unread
          db.query(
            'UPDATE chat_messages SET is_read = false WHERE id = ?',
            [result.insertId]
          ),
          // Increment admin messages count
          db.query(
            'UPDATE chat_rooms SET admin_messages_count = COALESCE(admin_messages_count, 0) + 1 WHERE id = ?',
            [roomId]
          )
        ]);

        // Send to user/seller
        io.to(`user_${room[0].user_id}`).emit('new_message', {
          ...messageData,
          is_read: false
        });
        // Show in admin's view as read
        socket.emit('new_message', {
          ...messageData,
          is_read: true
        });
        } else if (userType === 'seller') {
          // Seller message goes to admin room and shows in sender's view
          await Promise.all([
            // Mark message as unread
            db.query(
              'UPDATE chat_messages SET is_read = false WHERE id = ?',
              [result.insertId]
            ),
            // Increment unread count for admin
            db.query(
              'UPDATE chat_rooms SET unread_count = COALESCE(unread_count, 0) + 1 WHERE id = ?',
              [roomId]
            )
          ]);
          // Send to all admins except sender
          socket.to('admin_room').emit('new_message', messageData);
          // Show in sender's view
          socket.emit('new_message', messageData);
        }

        // Update room timestamp
        await db.query(
          'UPDATE chat_rooms SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [roomId]
        );
      }
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Error sending message' });
    }
  });

  // Handle typing status
  socket.on('typing', (data) => {
    const { roomId, isTyping } = data;
    if (!roomId) return;

    const userId = socket.user.id;
    const userType = socket.user.role;

    if (userType === 'admin') {
      // Notify the user/seller in the room
      socket.to(`user_${roomId}`).emit('typing_status', {
        roomId,
        userId,
        isTyping
      });
    } else {
      // Notify admins
      socket.to('admin_room').emit('typing_status', {
        roomId,
        userId,
        isTyping
      });
    }
  });

  // Handle message deletion
  socket.on('delete_message', async (data) => {
    try {
      const { messageId, roomId } = data;
      
      // Verify user is admin
      if (socket.user.role !== 'admin') {
        throw new Error('Only admins can delete messages');
      }

      // Delete message from database
      await db.query('DELETE FROM chat_messages WHERE id = ?', [messageId]);

      // Notify room participants
      const [room] = await db.query('SELECT user_id FROM chat_rooms WHERE id = ?', [roomId]);
      if (room.length > 0) {
        // Send to specific user's room only
        if (socket.user.role === 'admin') {
          io.to(`user_${room[0].user_id}`).emit('message_deleted', { messageId, roomId });
        }
        // Always notify admin room
        io.to('admin_room').emit('message_deleted', { messageId, roomId });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // Handle conversation deletion
  socket.on('delete_conversation', async (data) => {
    try {
      const { roomId } = data;
      
      // Verify user is admin
      if (socket.user.role !== 'admin') {
        throw new Error('Only admins can delete conversations');
      }

      // Delete all messages from the room
      await db.query('DELETE FROM chat_messages WHERE room_id = ?', [roomId]);
      
      // Get user ID for notification
      const [room] = await db.query('SELECT user_id FROM chat_rooms WHERE id = ?', [roomId]);
      
      if (room.length > 0) {
        // Send to specific user's room only
        if (socket.user.role === 'admin') {
          io.to(`user_${room[0].user_id}`).emit('conversation_deleted', { roomId });
        }
        // Always notify admin room
        io.to('admin_room').emit('conversation_deleted', { roomId });
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      socket.emit('error', { message: 'Failed to delete conversation' });
    }
  });

  socket.on('disconnect', () => {
    const userId = socket.user.id;
    console.log('User disconnected:', userId);
    connectedUsers.delete(userId);
    updateUserStatus(userId, false);
  });
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
  getUserStatus
};
