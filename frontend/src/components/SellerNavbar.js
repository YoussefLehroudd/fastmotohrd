import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Box,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  TwoWheeler as BikeIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  Payment as PaymentIcon,
  Star as ReviewsIcon,
  DirectionsBike as MotorsIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import NotificationsMenu from './NotificationsMenu';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const SellerNavbar = ({ selectedTab, onTabChange }) => {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavigation = (tabIndex) => {
    navigate('/seller');
    // Wait for navigation to complete before changing tab
    setTimeout(() => {
      if (onTabChange) {
        onTabChange(null, tabIndex);
      }
    }, 0);
  };

  const navItems = [
    { icon: <DashboardIcon />, title: 'Dashboard', index: 0 },
    { icon: <OrdersIcon />, title: 'Orders', index: 1 },
    { icon: <PaymentIcon />, title: 'Payments', index: 2 },
    { icon: <ReviewsIcon />, title: 'Reviews', index: 3 },
    { icon: <MotorsIcon />, title: 'My Motors', index: 4 }
  ];

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
      }}>
        <BikeIcon color="primary" />
        <Typography variant="subtitle1" color="primary">
          FastMoto Seller
        </Typography>
      </Box>
      <List sx={{ pt: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1 }}>
          {navItems.map((item) => (
            <ListItem 
              button 
              key={item.title}
              onClick={() => {
                handleNavigation(item.index);
                handleDrawerToggle();
              }}
              sx={{
                backgroundColor: selectedTab === item.index ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                py: 1.5, // More touch-friendly padding
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
            <ListItemIcon sx={{ color: selectedTab === item.index ? 'primary.main' : 'inherit', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.title} 
              sx={{ 
                '& .MuiListItemText-primary': {
                  color: selectedTab === item.index ? 'primary.main' : 'inherit',
                  fontWeight: selectedTab === item.index ? 500 : 400
                }
              }} 
            />
          </ListItem>
          ))}
        </Box>
        <ListItem 
          button 
          onClick={handleLogout}
          sx={{
            py: 1.5,
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutIcon color="error" />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            sx={{ 
              '& .MuiListItemText-primary': {
                color: 'error.main',
                fontWeight: 500
              }
            }} 
          />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1a237e' }}>
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        {!isMobile && (
          <>
            <BikeIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ mr: 2 }}>
              FastMoto Seller
            </Typography>
          </>
        )}

        <Box sx={{ 
          flexGrow: 1, 
          display: { xs: 'none', sm: 'flex' }, 
          gap: 1
        }}>
          <Tooltip title="Dashboard">
            <IconButton 
              color="inherit"
              onClick={() => handleNavigation(0)}
              sx={{ 
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                ...(selectedTab === 0 && {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                })
              }}
            >
              <DashboardIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Orders">
            <IconButton 
              color="inherit"
              onClick={() => handleNavigation(1)}
              sx={{ 
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                ...(selectedTab === 1 && {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                })
              }}
            >
              <OrdersIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Payments">
            <IconButton 
              color="inherit"
              onClick={() => handleNavigation(2)}
              sx={{ 
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                ...(selectedTab === 2 && {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                })
              }}
            >
              <PaymentIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Reviews">
            <IconButton 
              color="inherit"
              onClick={() => handleNavigation(3)}
              sx={{ 
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                ...(selectedTab === 3 && {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                })
              }}
            >
              <ReviewsIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="My Motors">
            <IconButton 
              color="inherit"
              onClick={() => handleNavigation(4)}
              sx={{ 
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                ...(selectedTab === 4 && {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                })
              }}
            >
              <MotorsIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 0.5, sm: 1 },
          ml: 'auto'
        }}>
          <NotificationsMenu />

          {user && (
            <>
              <Tooltip title={`${user.username}'s Profile`}>
                <IconButton
                  color="inherit"
                  onClick={() => navigate('/seller/profile')}
                  sx={{
                    width: { xs: 40, sm: 'auto' },
                    height: { xs: 40, sm: 'auto' },
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                    ...(window.location.pathname === '/seller/profile' && {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    })
                  }}
                >
                  <PersonIcon />
                </IconButton>
              </Tooltip>
              {!isMobile && (
                <Tooltip title="Logout">
                  <IconButton
                    color="inherit"
                    onClick={handleLogout}
                    sx={{
                      width: { xs: 40, sm: 'auto' },
                      height: { xs: 40, sm: 'auto' },
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                    }}
                  >
                    <LogoutIcon />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </Box>
      </Toolbar>
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true // Better open performance on mobile.
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default SellerNavbar;
