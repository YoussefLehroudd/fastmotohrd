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
        if (prev.some(msg => msg.id === message.id)) return prev;
        const newMessages = [...prev, message];
        // Only increment unread count if chat is closed and message is unread
        if (message.sender_type === 'admin' && !isOpen && !message.is_read) {
          setUnreadCount(prev => prev + 1);
        }
        return newMessages;
      });
      if (isOpen) scrollToBottom();
    });

    newSocket.on('typing_status', ({ isTyping: typing }) => {
      setIsTyping(typing);
    });

    newSocket.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    });

    newSocket.on('conversation_deleted', () => {
      setMessages([]);
    });

    setSocket(newSocket);

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
    if (isOpen && socket && room) {
      // Mark messages as read when opening chat
      socket.emit('mark_messages_read', { roomId: room.id });
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [isOpen]);

  // Handle new messages scroll
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket || !room) return;

    socket.emit('send_message', {
      roomId: room.id,
      message: message.trim()
    });

    setMessage('');
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
    if (!isOpen) {
      setUnreadCount(0);
      // Mark messages as read when opening chat
      if (socket && room) {
        socket.emit('mark_messages_read', { roomId: room.id });
      }
    }
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
                {`Messages from admin: ${messages.filter(m => m.sender_type === 'admin').length}`}
              </Typography>
            </Box>
            <IconButton size="small" onClick={toggleChat}>
              <CloseIcon />
            </IconButton>
          </Box>

          <MessageContainer>
            {messages.map((msg, index) => (
              <Message 
                key={index} 
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
        <Badge 
          badgeContent={isOpen ? 0 : messages.filter(m => m.sender_type === 'admin').length}
          color="primary"
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
      </Fab>
    </>
  );
};

export default ChatWidget;
