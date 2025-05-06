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

  // Join seller room if seller
  if (socket.user.role === 'seller') {
    socket.join('seller_room');
    socket.join(`seller_${socket.user.id}`); // Join seller-specific room
  }

  // Handle marking messages as read
  socket.on('mark_messages_read', async (data) => {
    try {
      const { roomId } = data;
      const userId = socket.user.id;
      const userType = socket.user.role;

      // Get the current user's role and mark only messages sent to them as read
      const currentUserType = socket.user.role;
      
      // Mark messages as read only for the current user type
      if (currentUserType === 'admin') {
        // Admin marks only non-admin messages as read
        await db.query(
          'UPDATE chat_messages SET admin_read = true WHERE room_id = ? AND sender_type != ?',
          [roomId, 'admin']
        );

        // Get updated unread count
        const [unreadResult] = await db.query(`
          SELECT COUNT(*) as count 
          FROM chat_messages 
          WHERE room_id = ? 
            AND sender_type != 'admin'
            AND admin_read = false
        `, [roomId]);

        // Update admin's unread count in database
        await db.query(
          'UPDATE chat_rooms SET admin_unread_count = ? WHERE id = ?',
          [unreadResult[0].count, roomId]
        );

        // Notify admins about updated count
        io.to('admin_room').emit('unread_count_updated', {
          roomId,
          unreadCount: unreadResult[0].count
        });
      } else if (currentUserType === 'seller') {
        // Seller marks admin messages as read
        await db.query(
          'UPDATE chat_messages SET seller_read = true WHERE room_id = ? AND sender_type = ?',
          [roomId, 'admin']
        );

        // Update seller's unread count
        await db.query(
          'UPDATE chat_rooms SET seller_unread_count = 0 WHERE id = ?',
          [roomId]
        );

        // Notify admin that seller read the messages
        io.to('admin_room').emit('messages_read_by_seller', { roomId, userId });
      } else if (currentUserType === 'user') {
        // User marks admin messages as read
        await db.query(
          'UPDATE chat_messages SET user_read = true WHERE room_id = ? AND sender_type = ?',
          [roomId, 'admin']
        );

        // Update user's unread count
        await db.query(
          'UPDATE chat_rooms SET user_unread_count = 0 WHERE id = ?',
          [roomId]
        );

        // Notify admin that user read the messages
        io.to('admin_room').emit('messages_read_by_user', { roomId, userId });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Handle unread messages request
  socket.on('get_unread_messages', async ({ roomId }) => {
    try {
      const userType = socket.user.role;
      let query = '';
      
      if (userType === 'admin') {
        query = `
          SELECT m.*, u.username as sender_name 
          FROM chat_messages m 
          JOIN users u ON m.sender_id = u.id 
          WHERE m.room_id = ? AND m.admin_read = false 
          ORDER BY m.created_at ASC
        `;
      } else if (userType === 'seller') {
        query = `
          SELECT m.*, u.username as sender_name 
          FROM chat_messages m 
          JOIN users u ON m.sender_id = u.id 
          WHERE m.room_id = ? AND m.seller_read = false 
          ORDER BY m.created_at ASC
        `;
      } else {
        query = `
          SELECT m.*, u.username as sender_name 
          FROM chat_messages m 
          JOIN users u ON m.sender_id = u.id 
          WHERE m.room_id = ? AND m.user_read = false 
          ORDER BY m.created_at ASC
        `;
      }
      
      const [messages] = await db.query(query, [roomId]);
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
      const { roomId, message, isOpen } = data;
      if (!roomId || !message) {
        throw new Error('Room ID and message are required');
      }

      const userId = socket.user.id;
      const userType = socket.user.role;

      // Get room info first to check recipient
      const [room] = await db.query(
        'SELECT user_id, user_type FROM chat_rooms WHERE id = ?',
        [roomId]
      );

      if (room.length > 0) {
        // Save message to database - only admin messages can be initially read
        const [result] = await db.query(`
          INSERT INTO chat_messages (
            room_id, 
            sender_id, 
            sender_type, 
            message, 
            admin_read,
            seller_read,
            user_read
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          roomId, 
          userId, 
          userType, 
          message,
          userType === 'admin',
          userType === 'seller',
          userType === 'user'
        ]);

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
          admin_read: userType === 'admin',
          seller_read: userType === 'seller',
          user_read: userType === 'user'
        };

        // Send message to appropriate rooms
        if (userType === 'admin') {
          // Send to user's room
          io.to(`user_${room[0].user_id}`).emit('new_message', messageData);
          
          // Send to admin room
          io.to('admin_room').emit('new_message', {
            ...messageData,
            admin_read: true,
            seller_read: userType === 'seller',
            user_read: userType === 'user'
          });

          // Update message read status and unread count for non-admin messages
          await db.query(
            'UPDATE chat_messages SET admin_read = true WHERE room_id = ? AND sender_type != ?',
            [roomId, 'admin']
          );
          await db.query(
            'UPDATE chat_rooms SET admin_unread_count = 0 WHERE id = ?',
            [roomId]
          );
        } else {
          // Only get unread count if chat is not open
          let unreadCount = 0;
          if (!isOpen) {
            const [unreadResult] = await db.query(`
              SELECT COUNT(*) as count 
              FROM chat_messages 
              WHERE room_id = ? 
                AND sender_type != 'admin'
                AND admin_read = false
            `, [roomId]);
            unreadCount = unreadResult[0].count;

            // Update unread count in database
            await db.query(
              'UPDATE chat_rooms SET admin_unread_count = ? WHERE id = ?',
              [unreadCount, roomId]
            );

            // Emit unread count update to admins
            io.to('admin_room').emit('unread_count_updated', {
              roomId,
              unreadCount
            });
          }

          // Send to admin room with unread status
          io.to('admin_room').emit('new_message', {
            ...messageData,
            admin_read: false,
            seller_read: userType === 'seller',
            user_read: userType === 'user',
            unread_count: unreadCount
          });

          // Send back to sender
          socket.emit('new_message', {
            ...messageData,
            admin_read: false,
            seller_read: userType === 'seller',
            user_read: userType === 'user'
          });
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
