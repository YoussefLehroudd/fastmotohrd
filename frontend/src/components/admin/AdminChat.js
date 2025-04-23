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

const DeleteButton = styled(IconButton)({
  padding: 4,
  opacity: 0,
  transition: 'opacity 0.2s',
  marginLeft: 8,
  '& svg': {
    fontSize: '1rem'
  }
});

const AdminChat = () => {
  const { user } = useUser();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState({});
  const messagesEndRef = useRef(null);
  const selectedRoomRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      fetch('http://localhost:5000/api/chat/history', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(res => res.json())
        .then(data => {
          setRooms(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching chat history:', error);
          setLoading(false);
        });
    });

    newSocket.on('new_message', (message) => {
      setRooms(prevRooms => {
        const roomIndex = prevRooms.findIndex(r => r.id === message.room_id);

        if (roomIndex === -1) return prevRooms;

        const updatedRooms = [...prevRooms];
        const room = updatedRooms[roomIndex];

        const isCurrentRoomSelected = selectedRoomRef.current?.id === message.room_id;
        const shouldIncrementUnread = message.sender_type === room.user_type && !isCurrentRoomSelected;

        const unreadCount = shouldIncrementUnread ? (room.unreadCount || 0) + 1 : 0;

        updatedRooms[roomIndex] = {
          ...room,
          messages: [...(room.messages || []), message],
          updated_at: new Date().toISOString(),
          unreadCount
        };

        if (isCurrentRoomSelected) {
          setTimeout(scrollToBottom, 100);
        }

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
        updatedRooms[roomIndex] = {
          ...updatedRooms[roomIndex],
          messages: updatedRooms[roomIndex].messages.filter(msg => msg.id !== messageId)
        };

        return updatedRooms;
      });
    });

    newSocket.on('conversation_deleted', ({ roomId }) => {
      setRooms(prevRooms => prevRooms.filter(r => r.id !== roomId));
      if (selectedRoomRef.current?.id === roomId) {
        setSelectedRoom(null);
      }
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [user]);

  useEffect(() => {
    if (selectedRoom?.messages?.length > 0) {
      scrollToBottom();
    }
  }, [selectedRoom?.messages, selectedRoom]);

  useEffect(() => {
    if (selectedRoom) {
      const updatedRoom = rooms.find(room => room.id === selectedRoom.id);
      if (updatedRoom && JSON.stringify(updatedRoom.messages) !== JSON.stringify(selectedRoom.messages)) {
        setSelectedRoom(updatedRoom);
      }
    }
  }, [rooms]);

  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (socket && selectedRoom) {
      socket.emit('typing', { roomId: selectedRoom.id, isTyping: true });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { roomId: selectedRoom.id, isTyping: false });
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

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit('typing', { roomId: selectedRoom.id, isTyping: false });
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
                onClick={() => {
                  setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unreadCount: 0 } : r));
                  setSelectedRoom(room);
                }}
                sx={{ position: 'relative' }}
              >
                <ListItemAvatar>
                  <Avatar>
                    {room.user_type === 'seller' ? <StorefrontIcon /> : <PersonIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={room.user_name || room.user_email || 'Unknown User'}
                  secondary={
                    <>
                      {`${room.user_type} • ${new Date(room.updated_at).toLocaleDateString()}`}
                      <br />
                      {`Messages received: ${room.messages?.filter(m => m.sender_type === room.user_type).length || 0}`}
                    </>
                  }
                />
                {room.unreadCount > 0 && (
                  <Box sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'error.main',
                    color: 'white',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem'
                  }}>
                    {room.unreadCount}
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
        </ChatList>

        <ChatBox elevation={3}>
          {selectedRoom ? (
            <>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">
                    {selectedRoom.user_name || selectedRoom.user_email || 'Unknown User'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedRoom.user_type} • {selectedRoom.messages?.filter(m => m.sender_type === selectedRoom.user_type).length || 0} messages received
                  </Typography>
                </Box>
                <IconButton color="error" onClick={() => {
                  if (window.confirm('Delete entire conversation?')) {
                    socket.emit('delete_conversation', { roomId: selectedRoom.id });
                    setSelectedRoom(null);
                  }
                }}>
                  <DeleteIcon />
                </IconButton>
              </Box>

              <MessageContainer>
                {selectedRoom.messages?.map((msg, index) => (
                  <MessageWrapper key={index} sx={{ justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start' }}>
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

              <Box component="form" onSubmit={handleSend} sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
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
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Typography color="textSecondary">Select a chat to start messaging</Typography>
            </Box>
          )}
        </ChatBox>
      </ChatContainer>
    </Container>
  );
};

export default AdminChat;
