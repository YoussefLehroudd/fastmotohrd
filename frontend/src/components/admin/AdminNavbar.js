import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  TwoWheeler as MotorIcon,
  BookOnline as BookingIcon,
  ExitToApp as LogoutIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Chat as ChatIcon,
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const expandedWidth = 240;
const collapsedWidth = 65;

const AdminNavbar = ({ activeTab, setActiveTab }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useUser();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, index: 0 },
    { text: 'Users', icon: <PeopleIcon />, index: 1 },
    { text: 'Motors', icon: <MotorIcon />, index: 2 },
    { text: 'Bookings', icon: <BookingIcon />, index: 3 },
    { text: 'Bank Details', icon: <BankIcon />, index: 4 },
    { text: 'Subscriptions', icon: <PaymentIcon />, index: 5 },
    { text: 'Chat', icon: <ChatIcon />, index: 6 }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? expandedWidth : collapsedWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? expandedWidth : collapsedWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1a237e',
          color: 'white',
          transition: 'width 0.2s',
          overflowX: 'hidden',
        },
      }}
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: open ? 'space-between' : 'center'
      }}>
        {open && (
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Admin Dashboard
          </Typography>
        )}
        <IconButton
          onClick={() => setOpen(!open)}
          sx={{ color: 'white' }}
        >
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>
      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => item.path ? navigate(item.path) : setActiveTab(item.index)}
            selected={item.path ? location.pathname === item.path : activeTab === item.index}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'white' }}>
              {item.icon}
            </ListItemIcon>
            {open && <ListItemText primary={item.text} />}
          </ListItem>
        ))}
      </List>
      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.12)', mt: 'auto' }} />
      <List>
        <ListItem
          button
          onClick={handleLogout}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.08)',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <LogoutIcon />
          </ListItemIcon>
          {open && <ListItemText primary="Logout" />}
        </ListItem>
      </List>
    </Drawer>
  );
};

export default AdminNavbar;
