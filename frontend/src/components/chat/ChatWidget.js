import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, IconButton, TextField, Badge, Fab, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import io from 'socket.io-client';
import { useUser } from '../../context/UserContext';

const ChatWindow = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 80,
  right: 20,
  width: 320,
  height: 400,
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1000,
}));

const MessageContainer = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: '10px',
  display: 'flex',
  flexDirection: 'column',
});

const Message = styled(Box)(({ theme, isOwn }) => ({
  maxWidth: '70%',
  padding: '8px 12px',
  borderRadius: 12,
  marginBottom: 8,
  wordWrap: 'break-word',
  alignSelf: isOwn ? 'flex-end' : 'flex-start',
  backgroundColor: isOwn ? theme.palette.primary.main : theme.palette.grey[200],
  color: isOwn ? theme.palette.primary.contrastText : theme.palette.text.primary,
}));

const ChatWidget = () => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminMessageCount, setAdminMessageCount] = useState(0);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user || user.role === 'admin') return;

    // Initialize socket
    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('new_message', (message) => {
      console.log('New message received:', message);
      setMessages(prev => {
        // Remove temporary message if this is our own message
        const isOwnMessage = message.sender_id === user.id;
        const filteredMessages = isOwnMessage 
          ? prev.filter(msg => !msg.id.toString().startsWith('temp-'))
          : prev;

        // Add the new message if it doesn't exist
        if (!filteredMessages.some(msg => msg.id === message.id)) {
          const newMessages = [...filteredMessages, message];
          
          // Update admin message count
          if (message.sender_type === 'admin') {
            setAdminMessageCount(count => count + 1);
            // Always mark as unread initially
            message.is_read = false;
          }
          
          return newMessages;
        }
        return prev;
      });
      if (isOpen) scrollToBottom();
    });

    newSocket.on('typing_status', ({ isTyping: typing }) => {
      setIsTyping(typing);
    });

    newSocket.on('message_deleted', ({ messageId }) => {
      setMessages(prev => {
        const updatedMessages = prev.filter(msg => msg.id !== messageId);
        // Update admin message count
        setAdminMessageCount(updatedMessages.filter(m => m.sender_type === 'admin').length);
        return updatedMessages;
      });
    });

    newSocket.on('conversation_deleted', () => {
      setMessages([]);
      setAdminMessageCount(0);
    });

    setSocket(newSocket);

    // Listen for admin_messages_read event to reset unread count
    newSocket.on('admin_messages_read', ({ roomId }) => {
      setUnreadCount(0);
      // Also update messages to mark them as read
      setMessages(prevMessages => 
        prevMessages.map(msg => ({
          ...msg,
          is_read: true
        }))
      );
    });

    // Get initial chat room and messages
    fetch('http://localhost:5000/api/chat/room', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to create chat room');
        return res.json();
      })
      .then(roomData => {
        setRoom(roomData);
        const initialMessages = roomData.messages || [];
        setMessages(initialMessages);
        // Set initial admin message count
        setAdminMessageCount(initialMessages.filter(m => m.sender_type === 'admin').length);
        setUnreadCount(initialMessages.filter(msg => !msg.is_read && msg.sender_type === 'admin').length);
      })
      .catch(error => {
        console.error('Chat initialization error:', error);
      });

    return () => {
      newSocket.close();
    };
  }, [user]);

  // Handle chat open/close
  useEffect(() => {
    if (socket && room && isOpen) {
      // Only mark messages as read when entering the conversation
      socket.emit('mark_messages_read', { roomId: room.id });
      
      // Update messages to mark them as read locally
      setMessages(prevMessages => 
        prevMessages.map(msg => ({
          ...msg,
          is_read: msg.sender_type === 'admin' ? true : msg.is_read
        }))
      );
      
      scrollToBottom();
    }
  }, [isOpen, socket, room]);

  // Mark messages as read when new messages arrive and chat is open
  useEffect(() => {
    if (isOpen && socket && room && messages.length > 0) {
      const unreadMessages = messages.filter(msg => !msg.is_read && msg.sender_type === 'admin');
      if (unreadMessages.length > 0) {
        socket.emit('mark_messages_read', { roomId: room.id });
        // Update messages to mark them as read locally
        setMessages(prevMessages => 
          prevMessages.map(msg => ({
            ...msg,
            is_read: true
          }))
        );
      }
    }
  }, [messages, isOpen, socket, room]);

  // Handle new messages scroll
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket || !room) return;

    // Create temporary message for immediate display
    const tempMessage = {
      id: 'temp-' + Date.now(),
      room_id: room.id,
      sender_id: user.id,
      sender_type: user.role,
      sender_name: user.username,
      message: message.trim(),
      created_at: new Date().toISOString(),
      is_read: isOpen // Mark as read if chat is open
    };

    // Add temporary message to UI
    setMessages(prev => [...prev, tempMessage]);

    // Send message to server with sender info and chat state
    socket.emit('send_message', {
      roomId: room.id,
      message: message.trim(),
      sender_type: user.role,
      sender_id: user.id,
      isOpen: isOpen // Tell server if chat is open
    });

    setMessage('');
    scrollToBottom();
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    if (socket && room) {
      socket.emit('typing', {
        roomId: room.id,
        isTyping: true
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', {
          roomId: room.id,
          isTyping: false
        });
      }, 1000);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  if (!user || user.role === 'admin') return null;

  return (
    <>
      {isOpen && (
        <ChatWindow elevation={3}>
          <Box sx={{ 
            p: 2, 
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box>
              <Box>Support Chat</Box>
              <Typography variant="caption" color="textSecondary">
                {`Messages from admin: ${adminMessageCount}`}
              </Typography>
            </Box>
            <IconButton size="small" onClick={toggleChat}>
              <CloseIcon />
            </IconButton>
          </Box>

          <MessageContainer>
            {messages.map((msg) => (
              <Message 
                key={msg.id || Date.now() + Math.random()} 
                isOwn={msg.sender_id === user?.id}
              >
                <Box sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 0.5 }}>
                  {msg.sender_name}
                </Box>
                {msg.message}
              </Message>
            ))}
            {isTyping && (
              <Box sx={{ fontSize: '0.8rem', color: 'text.secondary', ml: 1 }}>
                Admin is typing...
              </Box>
            )}
            <div ref={messagesEndRef} />
          </MessageContainer>

          <Box 
            component="form" 
            onSubmit={handleSend}
            sx={{ 
              p: 2, 
              borderTop: 1, 
              borderColor: 'divider',
              display: 'flex',
              gap: 1
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={message}
              onChange={handleTyping}
            />
            <IconButton type="submit" color="primary">
              <SendIcon />
            </IconButton>
          </Box>
        </ChatWindow>
      )}

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={toggleChat}
      >
        {messages.filter(msg => !msg.is_read && msg.sender_type === 'admin').length > 0 && (
          <Badge 
            badgeContent={messages.filter(msg => !msg.is_read && msg.sender_type === 'admin').length}
            color="error"
            sx={{ 
              "& .MuiBadge-badge": {
                fontSize: "0.8rem",
                minWidth: "20px",
                height: "20px"
              }
            }}
          >
            <ChatIcon />
          </Badge>
        )}
        {messages.filter(msg => !msg.is_read && msg.sender_type === 'admin').length === 0 && (
          <ChatIcon />
        )}
      </Fab>
    </>
  );
};

export default ChatWidget;
