import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Tooltip,
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material';
import {
  TwoWheeler as BikeIcon,
  Logout as LogoutIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import NotificationsMenu from './NotificationsMenu';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1a237e' }}>
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        <Stack 
          direction="row" 
          spacing={2} 
          alignItems="center" 
          sx={{ 
            width: '100%',
            maxWidth: isMobile ? '100%' : '80%',
            mx: 'auto'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <BikeIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div">
              FastMoto
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 0.5, sm: 1 }
        }}>
          {user && <NotificationsMenu />}

          {user && (
            <>
              <Tooltip title={user?.username || 'View Profile'}>
                <IconButton
                  color="inherit"
                  onClick={() => navigate('/profile')}
                  sx={{
                    width: { xs: 40, sm: 'auto' },
                    height: { xs: 40, sm: 'auto' },
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                    ...(window.location.pathname === '/profile' && {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    })
                  }}
                >
                  <PersonIcon />
                </IconButton>
              </Tooltip>
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
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
