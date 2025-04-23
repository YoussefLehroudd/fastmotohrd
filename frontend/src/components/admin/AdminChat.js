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
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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

const MessageWrapper = styled(Box)({
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: 8,
  '&:hover .delete-button': {
    opacity: 1
  }
});

const Message = styled(Box)(({ theme, isOwn }) => ({
  maxWidth: '70%',
  padding: '8px 12px',
  borderRadius: 12,
  wordWrap: 'break-word',
  alignSelf: isOwn ? 'flex-end' : 'flex-start',
  backgroundColor: isOwn ? theme.palette.primary.main : theme.palette.grey[200],
  color: isOwn ? theme.palette.primary.contrastText : theme.palette.text.primary,
}));

const DeleteButton = styled(IconButton)(({ theme }) => ({
  padding: 4,
  opacity: 0,
  transition: 'opacity 0.2s',
  marginLeft: 8,
  '& svg': {
    fontSize: '1rem'
  }
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

  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    // Connect socket first
    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Admin connected to socket');
      
      // Fetch chat rooms after successful socket connection
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
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('new_message', (message) => {
      setRooms(prevRooms => {
        // Find the room
        const roomIndex = prevRooms.findIndex(r => r.id === message.room_id);
        
        if (roomIndex === -1) {
          // If room doesn't exist, fetch all rooms again
          fetch('http://localhost:5000/api/chat/history', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          })
            .then(res => res.json())
            .then(data => {
              setRooms(data);
            })
            .catch(error => {
              console.error('Error fetching updated rooms:', error);
            });
          return prevRooms;
        }

        // Update existing room
        const updatedRooms = [...prevRooms];
        const room = updatedRooms[roomIndex];
        
        updatedRooms[roomIndex] = {
          ...room,
          messages: [...(room.messages || []), message],
          updated_at: new Date().toISOString()
        };

        // If this is the selected room, scroll to bottom
        if (selectedRoom?.id === message.room_id) {
          setTimeout(scrollToBottom, 100);
        }

        // Sort rooms by latest message
        return updatedRooms.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      });
    });

    newSocket.on('typing_status', ({ roomId, isTyping: typing }) => {
      setIsTyping(prev => ({ ...prev, [roomId]: typing }));
    });

    newSocket.on('message_deleted', ({ messageId, roomId }) => {
      setRooms(prevRooms => {
        const roomIndex = prevRooms.findIndex(r => r.id === roomId);
        if (roomIndex === -1) return prevRooms;

        const updatedRooms = [...prevRooms];
        const room = updatedRooms[roomIndex];
        
        updatedRooms[roomIndex] = {
          ...room,
          messages: room.messages.filter(msg => msg.id !== messageId)
        };

        return updatedRooms;
      });
    });

    newSocket.on('conversation_deleted', ({ roomId }) => {
      setRooms(prevRooms => prevRooms.filter(r => r.id !== roomId));
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
      }
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [user]);

  // Scroll to bottom when messages change or room is selected
  useEffect(() => {
    if (selectedRoom?.messages?.length > 0) {
      scrollToBottom();
    }
  }, [selectedRoom?.messages, selectedRoom]);

  // Update selected room when rooms change
  useEffect(() => {
    if (selectedRoom) {
      const updatedRoom = rooms.find(room => room.id === selectedRoom.id);
      if (updatedRoom && JSON.stringify(updatedRoom) !== JSON.stringify(selectedRoom)) {
        setSelectedRoom(updatedRoom);
      }
    }
  }, [rooms]);

  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    if (socket && selectedRoom) {
      socket.emit('typing', {
        roomId: selectedRoom.id,
        isTyping: true
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', {
          roomId: selectedRoom.id,
          isTyping: false
        });
      }, 1000);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket || !selectedRoom) return;

    socket.emit('send_message', {
      roomId: selectedRoom.id,
      message: message.trim()
    });

    setMessage('');
    
    // Clear typing indicator when sending message
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit('typing', {
        roomId: selectedRoom.id,
        isTyping: false
      });
    }
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
              <Box sx={{ 
                p: 2, 
                borderBottom: 1, 
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Box>
                  <Typography variant="h6">
                    {selectedRoom.user_name || selectedRoom.user_email || 'Unknown User'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedRoom.user_type}
                  </Typography>
                </Box>
                <IconButton 
                  color="error" 
                  onClick={() => {
                    if (window.confirm('Delete entire conversation? This cannot be undone.')) {
                      socket.emit('delete_conversation', { roomId: selectedRoom.id });
                      setSelectedRoom(null);
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              <MessageContainer>
                {selectedRoom.messages?.map((msg, index) => (
                  <MessageWrapper
                    key={index}
                    sx={{
                      justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <Message isOwn={msg.sender_id === user.id}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {msg.sender_name}
                      </Typography>
                      {msg.message}
                    </Message>
                    <DeleteButton
                      className="delete-button"
                      size="small"
                      onClick={() => {
                        if (window.confirm('Delete this message?')) {
                          socket.emit('delete_message', {
                            messageId: msg.id,
                            roomId: selectedRoom.id
                          });
                        }
                      }}
                    >
                      <DeleteOutlineIcon />
                    </DeleteButton>
                  </MessageWrapper>
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
                  onChange={handleTyping}
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
