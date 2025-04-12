import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  CircularProgress,
  Button,
  Tooltip,
  Checkbox,
  alpha
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon
} from '@mui/icons-material';

import { useUser } from '../context/UserContext';

const NotificationsMenu = () => {
  const { user } = useUser();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    fetchNotifications();

    // Connect to WebSocket
    const token = document.cookie.split('=')[1];
    const ws = new WebSocket(`ws://localhost:5000?token=${token}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        setNotifications(prev => [data.data, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectionMode(false);
    setSelectedNotifications([]);
  };

  const handleNotificationClick = (notification) => {
    if (selectionMode) {
      handleNotificationSelect(notification.id);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PATCH',
        credentials: 'include'
      });
      
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedNotifications([]);
  };

  const handleNotificationSelect = (notificationId) => {
    setSelectedNotifications(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const handleDeleteSelected = async () => {
    try {
      for (const id of selectedNotifications) {
        await fetch(`http://localhost:5000/api/notifications/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
      }
      
      const remainingNotifications = notifications.filter(
        n => !selectedNotifications.includes(n.id)
      );
      setNotifications(remainingNotifications);
      
      const deletedUnreadCount = notifications
        .filter(n => selectedNotifications.includes(n.id) && !n.isRead)
        .length;
      setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount));
      
      setSelectedNotifications([]);
      setSelectionMode(false);
    } catch (error) {
      console.error('Error deleting selected notifications:', error);
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      await fetch('http://localhost:5000/api/notifications/delete-all', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      setNotifications([]);
      setUnreadCount(0);
      setSelectionMode(false);
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const getNotificationColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error.main';
      case 'medium':
        return 'warning.main';
      default:
        return 'info.main';
    }
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{
            width: { xs: 40, sm: 'auto' },
            height: { xs: 40, sm: 'auto' },
            transition: 'transform 0.2s',
            '&:hover': { 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transform: 'scale(1.1)'
            }
          }}
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                minWidth: '18px',
                height: '18px',
                padding: '0 4px'
              }
            }}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
            mt: 1.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid',
            borderColor: 'divider',
            '& .MuiList-root': {
              padding: 0
            }
          }
        }}
      >
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04)
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
            {notifications.length > 0 && (
              <>
                {selectionMode ? (
                  <>
                    <Button 
                      size="small" 
                      onClick={handleSelectAll}
                      sx={{ 
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        color: 'primary.main',
                        '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                      }}
                    >
                      {selectedNotifications.length === notifications.length ? 'UNSELECT ALL' : 'SELECT ALL'}
                    </Button>
                    {selectedNotifications.length > 0 && (
                      <IconButton
                        size="small"
                        onClick={handleDeleteSelected}
                        sx={{ 
                          color: 'error.main',
                          '&:hover': { 
                            backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1)
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                    <Button 
                      size="small" 
                      onClick={toggleSelectionMode}
                      sx={{ 
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        color: 'text.secondary',
                        '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                      }}
                    >
                      CANCEL
                    </Button>
                  </>
                ) : (
                  <>
                    {unreadCount > 0 && (
                      <Button 
                        size="small" 
                        onClick={handleMarkAllRead}
                        sx={{ 
                          fontSize: '0.8rem',
                          textTransform: 'none',
                          color: 'text.secondary',
                          '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                        }}
                      >
                        MARK ALL READ
                      </Button>
                    )}
                    <Button 
                      size="small" 
                      onClick={toggleSelectionMode}
                      sx={{ 
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        color: 'primary.main',
                        '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                      }}
                    >
                      SELECT
                    </Button>
                  </>
                )}
              </>
            )}
          </Box>
        </Box>
        <Divider />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            <Typography variant="body2">
              No notifications
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
            {notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderLeft: notification.isRead ? 'none' : '4px solid',
                  borderLeftColor: getNotificationColor(notification.priority),
                  '&:hover': {
                    backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.1)
                  }
                }}
              >
                <Box sx={{ 
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  gap: 1.5,
                  position: 'relative'
                }}>
                  {selectionMode && (
                    <Checkbox
                      checked={selectedNotifications.includes(notification.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationSelect(notification.id);
                      }}
                      sx={{ 
                        mt: -0.5,
                        '&.Mui-checked': {
                          color: 'primary.main'
                        }
                      }}
                    />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, position: 'relative' }}>
                      {!notification.isRead && !selectionMode && (
                        <CircleIcon 
                          sx={{ 
                            fontSize: 8, 
                            mr: 1,
                            color: getNotificationColor(notification.priority)
                          }} 
                        />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: notification.isRead ? 'normal' : 600,
                          color: notification.isRead ? 'text.secondary' : 'text.primary',
                          lineHeight: 1.4
                        }}
                      >
                        {notification.content}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ 
                        display: 'block',
                        color: 'text.disabled',
                        fontSize: '0.75rem'
                      }}
                    >
                      {new Date(notification.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Box>
        )}
      </Menu>
    </>
  );
};

export default NotificationsMenu;
