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

// Styled components remain the same...
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
    // When room is selected and socket exists, mark messages as read
    if (selectedRoom && socket) {
      socket.emit('mark_messages_read', { roomId: selectedRoom.id });
    }
  }, [selectedRoom, socket]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      // Join admin room
      newSocket.emit('join', { room: 'admin_room' });
      
      fetch('http://localhost:5000/api/chat/history', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(res => res.json())
        .then(data => {
          // If we have a selected room, mark its messages as read
          if (selectedRoomRef.current) {
            const roomId = selectedRoomRef.current.id;
            newSocket.emit('mark_messages_read', { roomId });
            // Update the room's unread count in the data
            data = data.map(room => 
              room.id === roomId ? { ...room, unread_count: 0 } : room
            );
          }
          setRooms(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching chat history:', error);
          setLoading(false);
        });
    });

    // Debug socket events
    newSocket.onAny((event, ...args) => {
      console.log('Socket event:', event, args);
    });

    newSocket.on('new_message', (message) => {
      // Remove any temporary message if this is our own message
      const isOwnMessage = message.sender_id === user.id;
      
      setRooms(prevRooms => {
        const roomIndex = prevRooms.findIndex(r => r.id === message.room_id);
        if (roomIndex === -1) return prevRooms;

        const updatedRooms = [...prevRooms];
        const room = updatedRooms[roomIndex];

        const isCurrentRoomSelected = selectedRoomRef.current?.id === message.room_id;
        
        // Filter out temporary message if this is our own message
        const currentMessages = room.messages || [];
        const filteredMessages = isOwnMessage 
          ? currentMessages.filter(msg => !msg.id.toString().startsWith('temp-'))
          : currentMessages;

        // Add the new message
        const updatedMessages = [...filteredMessages, message];

        // Always increment unread count for non-admin messages when room not selected
        const newUnreadCount = message.sender_type !== 'admin' 
          ? (isCurrentRoomSelected ? 0 : (room.unread_count || 0) + 1)
          : (room.unread_count || 0);

        updatedRooms[roomIndex] = {
          ...room,
          messages: updatedMessages,
          updated_at: new Date().toISOString(),
          unread_count: newUnreadCount
        };

        // Update selected room if this is the current room
        if (isCurrentRoomSelected) {
          setSelectedRoom(prev => ({
            ...prev,
            messages: updatedMessages
          }));
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

    // Handle messages being read by users
    newSocket.on('messages_read_by_user', ({ roomId, userId }) => {
      setRooms(prevRooms => {
        const roomIndex = prevRooms.findIndex(r => r.id === roomId);
        if (roomIndex === -1) return prevRooms;

        const updatedRooms = [...prevRooms];
        const room = updatedRooms[roomIndex];

        // Update messages to mark them as read
        const updatedMessages = room.messages.map(msg => ({
          ...msg,
          is_read: msg.sender_type === 'admin' ? true : msg.is_read
        }));

        updatedRooms[roomIndex] = {
          ...room,
          messages: updatedMessages
        };

        // Update selected room if this is the current room
        if (selectedRoomRef.current?.id === roomId) {
          setSelectedRoom(prev => ({
            ...prev,
            messages: updatedMessages
          }));
        }

        return updatedRooms;
      });
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [user]);

  useEffect(() => {
    if (selectedRoom?.messages?.length > 0) {
      scrollToBottom();
    }
  }, [selectedRoom?.messages]);

  // Listen for unread count updates
  useEffect(() => {
    if (socket) {
      socket.on('unread_count_updated', ({ roomId, unreadCount }) => {
        setRooms(prevRooms => 
          prevRooms.map(room => 
            room.id === roomId ? { ...room, unread_count: unreadCount } : room
          )
        );
      });

      return () => {
        socket.off('unread_count_updated');
      };
    }
  }, [socket]);

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

    // Create temporary message object for immediate display
    const tempMessage = {
      room_id: selectedRoom.id,
      sender_id: user.id,
      sender_type: 'admin',
      sender_name: user.username,
      message: message.trim(),
      created_at: new Date().toISOString(),
      is_read: true,
      id: 'temp-' + Date.now() // Temporary ID
    };

    // Update UI immediately
    setSelectedRoom(prev => ({
      ...prev,
      messages: [...(prev.messages || []), tempMessage]
    }));

    // Send message to server
    socket.emit('send_message', {
      roomId: selectedRoom.id,
      message: message.trim()
    });

    setMessage('');
    scrollToBottom();

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
                  // Mark messages as read when selecting room
                  if (socket && room.unread_count > 0) {
                    socket.emit('mark_messages_read', { roomId: room.id });
                  }
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
                      {`Messages received: ${room.messages?.filter(m => m.sender_type === 'seller').length || 0}`}
                    </>
                  }
                />
                {room.unread_count > 0 && (
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
                    {room.unread_count}
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
                    {selectedRoom.user_type} • {selectedRoom.messages?.filter(m => m.sender_type === 'seller').length || 0} messages received
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
                  <MessageWrapper key={msg.id || index} sx={{ justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start' }}>
                    <Message isOwn={msg.sender_id === user.id}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {msg.sender_name}
                      </Typography>
                      {msg.message}
                    </Message>
                    {!msg.id.toString().startsWith('temp-') && (
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
                    )}
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
