import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Container
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import StorefrontIcon from '@mui/icons-material/Storefront';
import io from 'socket.io-client';
import { useUser } from '../../context/UserContext';

const ChatContainer = styled(Box)({
  display: 'flex',
  height: 'calc(100vh - 100px)',
  gap: '20px',
  padding: '20px'
});

const ChatList = styled(Paper)({
  width: '300px',
  overflow: 'auto'
});

const ChatBox = styled(Paper)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column'
});

const MessageContainer = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column'
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

const AdminChat = () => {
  const { user } = useUser();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    // Fetch chat rooms
    fetch('http://localhost:5000/api/chat/history', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch chat history');
        }
        return res.json();
      })
      .then(data => {
        setRooms(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching chat history:', error);
        setLoading(false);
      });

    // Connect socket
    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Admin connected to socket');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('new_message', (message) => {
      setRooms(prevRooms => {
        return prevRooms.map(room => {
          if (room.id === message.room_id) {
            return {
              ...room,
              messages: [...(room.messages || []), message],
              updated_at: new Date().toISOString()
            };
          }
          return room;
        }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      });
      scrollToBottom();
    });

    newSocket.on('typing_status', ({ roomId, isTyping: typing }) => {
      setIsTyping(prev => ({ ...prev, [roomId]: typing }));
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedRoom?.messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket || !selectedRoom) return;

    socket.emit('send_message', {
      roomId: selectedRoom.id,
      message: message.trim()
    });

    setMessage('');
  };

  if (!user || user.role !== 'admin') {
    return (
      <Container>
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          Admin access required
        </Typography>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <ChatContainer>
        <ChatList elevation={3}>
          <List>
            {rooms.map((room) => (
              <ListItem
                button
                key={room.id}
                selected={selectedRoom?.id === room.id}
                onClick={() => setSelectedRoom(room)}
              >
                <ListItemAvatar>
                  <Avatar>
                    {room.user_type === 'seller' ? <StorefrontIcon /> : <PersonIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={room.user_name || room.user_email || 'Unknown User'}
                  secondary={`${room.user_type} • ${new Date(room.updated_at).toLocaleDateString()}`}
                />
              </ListItem>
            ))}
          </List>
        </ChatList>

        <ChatBox elevation={3}>
          {selectedRoom ? (
            <>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">
                  {selectedRoom.user_name || selectedRoom.user_email || 'Unknown User'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedRoom.user_type}
                </Typography>
              </Box>

              <MessageContainer>
                {selectedRoom.messages?.map((msg, index) => (
                  <Message
                    key={index}
                    isOwn={msg.sender_id === user.id}
                  >
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {msg.sender_name}
                    </Typography>
                    {msg.message}
                  </Message>
                ))}
                {isTyping[selectedRoom.id] && (
                  <Box sx={{ fontSize: '0.8rem', color: 'text.secondary', ml: 1 }}>
                    User is typing...
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
                  onChange={(e) => setMessage(e.target.value)}
                />
                <IconButton type="submit" color="primary">
                  <SendIcon />
                </IconButton>
              </Box>
            </>
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <Typography color="textSecondary">
                Select a chat to start messaging
              </Typography>
            </Box>
          )}
        </ChatBox>
      </ChatContainer>
    </Container>
  );
};

export default AdminChat;
