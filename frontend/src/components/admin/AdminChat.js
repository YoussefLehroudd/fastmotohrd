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
  useTheme,
  useMediaQuery,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogActions,
  Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import io from 'socket.io-client';
import { useUser } from '../../context/UserContext';

// Styled components
const PageContainer = styled(Box)({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
});

const ChatContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  gap: '16px',
  padding: '16px',
  height: '100%',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    padding: '8px',
    gap: '8px'
  }
}));

const ChatList = styled(Paper)(({ theme }) => ({
  width: '300px',
  overflow: 'auto',
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    maxHeight: '300px',
    display: 'block'
  }
}));

const ChatBox = styled(Paper)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
}));

const MessageContainer = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: '8px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  '&::-webkit-scrollbar': {
    width: '8px'
  },
  '&::-webkit-scrollbar-track': {
    background: '#f1f1f1'
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#888',
    borderRadius: '4px',
    '&:hover': {
      background: '#555'
    }
  }
});

const MessageWrapper = styled(Box)(({ theme, isOwn }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  marginBottom: 4,
  justifyContent: isOwn ? 'flex-end' : 'flex-start',
  gap: '4px',
  padding: '4px 8px',
  flexDirection: isOwn ? 'row-reverse' : 'row',
  '& .delete-button': {
    opacity: 0,
    transition: 'opacity 0.2s ease'
  },
  '&:hover .delete-button': {
    opacity: 1
  }
}));

const Message = styled(Box)(({ theme, isOwn }) => ({
  maxWidth: '85%',
  padding: '8px 12px',
  borderRadius: 12,
  wordWrap: 'break-word',
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
  backgroundColor: isOwn ? theme.palette.primary.main : theme.palette.grey[200],
  color: isOwn ? theme.palette.primary.contrastText : theme.palette.text.primary,
  '& p': {
    margin: 0,
    maxWidth: '100%'
  }
}));

const DeleteButton = styled(IconButton)({
  padding: 4,
  opacity: 0,
  transition: 'opacity 0.2s',
  width: '24px',
  height: '24px',
  minWidth: '24px',
  '& svg': {
    fontSize: '1rem'
  }
});

const AdminChat = () => {
  const { user } = useUser();
  const [allRooms, setAllRooms] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState({});
  const messagesEndRef = useRef(null);
  const selectedRoomRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showList, setShowList] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('join', { room: 'admin_room' });
      
      fetch('http://localhost:5000/api/chat/history', {
        method: 'GET',
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          setAllRooms(data);
          setRooms(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching chat history:', error);
          setLoading(false);
        });
    });

    newSocket.onAny((event, ...args) => {
      console.log('Socket event:', event, args);
    });

    newSocket.on('new_message', (message) => {
      const isOwnMessage = message.sender_id === user.id;
      
      setRooms(prevRooms => {
        const roomIndex = prevRooms.findIndex(r => r.id === message.room_id);
        if (roomIndex === -1) return prevRooms;

        const updatedRooms = [...prevRooms];
        const room = updatedRooms[roomIndex];
        const isCurrentRoomSelected = selectedRoomRef.current?.id === message.room_id;
        
        const currentMessages = room.messages || [];
        const filteredMessages = isOwnMessage 
          ? currentMessages.filter(msg => !msg.id.toString().startsWith('temp-'))
          : currentMessages;

        const updatedMessages = [...filteredMessages, message];
        const newUnreadCount = message.sender_type !== 'admin' 
          ? (isCurrentRoomSelected ? 0 : (room.unread_count || 0) + 1)
          : (room.unread_count || 0);

        updatedRooms[roomIndex] = {
          ...room,
          messages: updatedMessages,
          updated_at: new Date().toISOString(),
          unread_count: newUnreadCount
        };

        if (isCurrentRoomSelected) {
          setSelectedRoom(prev => ({
            ...prev,
            messages: updatedMessages
          }));
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
        const updatedMessages = updatedRooms[roomIndex].messages.filter(msg => msg.id !== messageId);
        
        updatedRooms[roomIndex] = {
          ...updatedRooms[roomIndex],
          messages: updatedMessages
        };

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

  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
    if (selectedRoom && socket) {
      socket.emit('mark_messages_read', { roomId: selectedRoom.id });
      setRooms(prevRooms => 
        prevRooms.map(room => 
          room.id === selectedRoom.id ? { ...room, unread_count: 0 } : room
        )
      );
      setSelectedRoom(prev => ({
        ...prev,
        unread_count: 0,
        messages: prev.messages?.map(msg => ({
          ...msg,
          admin_read: msg.sender_type !== 'admin' ? true : msg.admin_read
        }))
      }));
      if (isMobile) {
        setShowList(false);
      }
      // Only scroll to bottom when first entering a chat
      if (!hasScrolled) {
        scrollToBottom();
        setHasScrolled(true);
      }
    }
  }, [selectedRoom, socket, isMobile, hasScrolled]);

  // Reset hasScrolled when changing rooms
  useEffect(() => {
    if (selectedRoom) {
      setHasScrolled(false);
    }
  }, [selectedRoom?.id]);

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

    const tempMessage = {
      room_id: selectedRoom.id,
      sender_id: user.id,
      sender_type: 'admin',
      sender_name: user.username,
      message: message.trim(),
      created_at: new Date().toISOString(),
      admin_read: true,
      seller_read: false,
      user_read: false,
      id: 'temp-' + Date.now()
    };

    setSelectedRoom(prev => ({
      ...prev,
      messages: [...(prev.messages || []), tempMessage]
    }));

    socket.emit('send_message', {
      roomId: selectedRoom.id,
      message: message.trim()
    });

    setMessage('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit('typing', { roomId: selectedRoom.id, isTyping: false });
    }

    // Scroll to bottom after sending message
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  if (!user || user.role !== 'admin') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography variant="h6">Admin access required</Typography>
      </Box>
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
    <PageContainer>
      <ChatContainer>
        {(!isMobile || showList) && (
          <ChatList elevation={3}>
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search users..."
                onChange={(e) => {
                  const searchTerm = e.target.value.toLowerCase();
                  if (!searchTerm) {
                    setRooms(allRooms);
                  } else {
                    setRooms(allRooms.filter(room => 
                      (room.user_name && room.user_name.toLowerCase().includes(searchTerm)) ||
                      (room.user_email && room.user_email.toLowerCase().includes(searchTerm))
                    ));
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            <List>
              {rooms.map((room) => (
                <ListItem
                  button
                  key={room.id}
                  selected={selectedRoom?.id === room.id}
                  onClick={() => setSelectedRoom(room)}
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
                        {`Messages received: ${room.messages?.filter(m => m.sender_type !== 'admin').length || 0}`}
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
        )}

        {(!isMobile || !showList) && (
          <ChatBox elevation={3}>
            {selectedRoom ? (
              <>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isMobile && (
                      <IconButton 
                        onClick={() => {
                          setShowList(true);
                          setSelectedRoom(null);
                        }}
                      >
                        <ArrowBackIcon />
                      </IconButton>
                    )}
                    <Box>
                      <Typography variant="h6">
                        {selectedRoom.user_name || selectedRoom.user_email || 'Unknown User'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {selectedRoom.user_type} • {selectedRoom.messages?.filter(m => m.sender_type !== 'admin').length || 0} messages received
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton 
                    color="error" 
                    onClick={() => {
                      setRoomToDelete(selectedRoom);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <MessageContainer>
                  {[...(selectedRoom.messages || [])].map((msg, index) => (
                    <MessageWrapper key={msg.id || index} sx={{ justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start' }}>
                      {!msg.id.toString().startsWith('temp-') && (
                        <>
                          {msg.sender_id === user.id && (
                            <DeleteButton
                              className="delete-button"
                              size="small"
                              onClick={() => {
                                setMessageToDelete(msg);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <DeleteOutlineIcon />
                            </DeleteButton>
                          )}
                          <Message isOwn={msg.sender_id === user.id}>
                            <Typography sx={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                              {msg.message}
                            </Typography>
                          </Message>
                          {msg.sender_id !== user.id && (
                            <DeleteButton
                              className="delete-button"
                              size="small"
                              onClick={() => {
                                setMessageToDelete(msg);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <DeleteOutlineIcon />
                            </DeleteButton>
                          )}
                        </>
                      )}
                    </MessageWrapper>
                  ))}
                  <div ref={messagesEndRef} />
                </MessageContainer>
                {isTyping[selectedRoom.id] && (
                    <Box sx={{ 
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                      opacity: 0.8,
                      mb: 1,
                      mt: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      '&::before': {
                        content: '""',
                        width: '4px',
                        height: '4px',
                        backgroundColor: 'currentColor',
                        borderRadius: '50%',
                        animation: 'pulse 1s infinite'
                      },
                      '@keyframes pulse': {
                        '0%': { opacity: 0.4 },
                        '50%': { opacity: 1 },
                        '100%': { opacity: 0.4 }
                      }
                    }}>
                      User is typing...
                    </Box>
                  )}
              
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
        )}
      </ChatContainer>
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setRoomToDelete(null);
          setMessageToDelete(null);
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 300
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          {messageToDelete ? 'Delete this message?' : 'Delete this conversation?'}
        </DialogTitle>
        <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
          <Button 
            variant="contained"
            onClick={() => {
              if (messageToDelete) {
                socket.emit('delete_message', {
                  messageId: messageToDelete.id,
                  roomId: selectedRoom.id
                });
              } else if (roomToDelete) {
                socket.emit('delete_conversation', { roomId: roomToDelete.id });
                setAllRooms(prevRooms => prevRooms.filter(room => room.id !== roomToDelete.id));
                setRooms(prevRooms => prevRooms.filter(room => room.id !== roomToDelete.id));
                setSelectedRoom(null);
                if (isMobile) setShowList(true);
              }
              setDeleteDialogOpen(false);
              setRoomToDelete(null);
              setMessageToDelete(null);
            }}
            sx={{
              bgcolor: 'error.main',
              '&:hover': {
                bgcolor: 'error.dark'
              }
            }}
          >
            Delete
          </Button>
          <Button 
            variant="outlined"
            onClick={() => {
              setDeleteDialogOpen(false);
              setRoomToDelete(null);
              setMessageToDelete(null);
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default AdminChat;
