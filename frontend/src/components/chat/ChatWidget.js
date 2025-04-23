import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, IconButton, TextField, Badge, Fab } from '@mui/material';
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

    if (isOpen) {
      // First create/get chat room
      fetch('http://localhost:5000/api/chat/room', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to create chat room');
          }
          return res.json();
        })
        .then(roomData => {
          console.log('Room created:', roomData);
          setRoom(roomData);
          if (roomData.messages) {
            setMessages(roomData.messages);
            scrollToBottom();
          }
          
          // Then connect socket
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
            setMessages(prev => [...prev, message]);
            if (!isOpen) {
              setUnreadCount(prev => prev + 1);
            }
            scrollToBottom();
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

          newSocket.on('error', (error) => {
            console.error('Socket error:', error);
          });

          setSocket(newSocket);
        })
        .catch(error => {
          console.error('Chat initialization error:', error);
        });

      return () => {
        if (socket) {
          socket.close();
          setSocket(null);
        }
      };
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
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
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
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
            <Box>Support Chat</Box>
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
        <Badge badgeContent={unreadCount} color="error">
          <ChatIcon />
        </Badge>
      </Fab>
    </>
  );
};

export default ChatWidget;
