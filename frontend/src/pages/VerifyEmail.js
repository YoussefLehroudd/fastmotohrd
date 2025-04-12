import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Container, Paper, CircularProgress } from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import axios from 'axios';

const VerifyEmail = () => {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = new URLSearchParams(location.search).get('token');
        if (!token) {
          setStatus('error');
          setMessage('Invalid verification link');
          setTimeout(() => navigate('/signup'), 3000);
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/auth/verify-email?token=${token}`);
        
        if (response.data.success) {
          setStatus('success');
          setMessage('Email verified successfully! You can now login.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Verification failed');
          setTimeout(() => navigate('/signup'), 2000);
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage(error.response?.data?.message || 'Invalid verification link');
        setTimeout(() => navigate('/signup'), 3000);
      }
    };

    verifyEmail();
  }, [location, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
        padding: 3
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          {status === 'verifying' && (
            <>
              <CircularProgress 
                size={60}
                sx={{ 
                  color: '#1a237e',
                  mb: 2
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  color: '#1a237e',
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Verifying Email...
              </Typography>
              <Typography
                sx={{
                  color: '#666',
                  fontSize: '1rem'
                }}
              >
                Please wait while we verify your email address
              </Typography>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle 
                sx={{ 
                  fontSize: 60,
                  color: '#4caf50',
                  mb: 2
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  color: '#4caf50',
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Email Verified Successfully!
              </Typography>
              <Typography
                sx={{
                  color: '#666',
                  fontSize: '1rem'
                }}
              >
                {message}
                <br />
                Redirecting to login page...
              </Typography>
            </>
          )}

          {status === 'error' && (
            <>
              <Error 
                sx={{ 
                  fontSize: 60,
                  color: '#dc3545',
                  mb: 2
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  color: '#dc3545',
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Verification Failed
              </Typography>
              <Typography
                sx={{
                  color: '#666',
                  fontSize: '1rem'
                }}
              >
                {message}
                <br />
                Redirecting to signup page...
              </Typography>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default VerifyEmail;
