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

const handleConnection = (socket) => {
  const userId = socket.user.id;
  console.log('User connected:', userId);

  // Store connection and update status
  connectedUsers.set(userId, socket);
  updateUserStatus(userId, true);

  // Join user's room
  const userRoom = `user_${userId}`;
  socket.join(userRoom);

  // If admin, join admin room
  if (socket.user.role === 'admin') {
    socket.join('admin_room');
  }

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

      // Save message to database
      const [result] = await db.query(`
        INSERT INTO chat_messages (room_id, sender_id, sender_type, message)
        VALUES (?, ?, ?, ?)
      `, [roomId, userId, userType, message]);

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
        // Emit to room participants
        if (userType === 'admin') {
          // Admin message goes to the user/seller
          io.to(`user_${room[0].user_id}`).emit('new_message', messageData);
        } else {
          // User/seller message goes to admin room
          io.to('admin_room').emit('new_message', messageData);
        }
        // Also emit to sender
        socket.emit('new_message', messageData);

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
