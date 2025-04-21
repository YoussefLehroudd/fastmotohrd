const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('../db');

let io;

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
  console.log('User connected:', socket.user.id);

  // Join user's room
  const userRoom = `user_${socket.user.id}`;
  socket.join(userRoom);

  // If admin, join admin room
  if (socket.user.role === 'admin') {
    socket.join('admin_room');
  }

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

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.id);
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
  getIO
};
