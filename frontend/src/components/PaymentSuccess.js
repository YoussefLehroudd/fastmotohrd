import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const PaymentSuccess = () => {
  return (
    <Paper 
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        textAlign: 'center',
        p: 4,
        backgroundColor: '#f0fff4',
        borderRadius: 2
      }}
    >
      <Box sx={{ 
        animation: 'bounce 1s infinite',
        '@keyframes bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }}>
        <CheckCircleIcon 
          sx={{ 
            fontSize: 80, 
            color: '#2e7d32'
          }} 
        />
      </Box>
      
      <Typography 
        variant="h4" 
        sx={{ 
          mt: 3, 
          color: '#2e7d32',
          fontWeight: 'bold'
        }}
      >
        Payment Successful!
      </Typography>
      
      <Typography 
        variant="h6" 
        sx={{ 
          mt: 2, 
          color: '#1b5e20'
        }}
      >
        Your booking has been confirmed
      </Typography>
    </Paper>
  );
};

export default PaymentSuccess;
