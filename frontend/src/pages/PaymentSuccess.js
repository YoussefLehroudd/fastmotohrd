import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Paper } from '@mui/material';
import PaymentSuccess from '../components/PaymentSuccess';
import Navbar from '../components/Navbar';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  useEffect(() => {
    // Show success message for 3 seconds before redirecting
    const timer = setTimeout(() => {
      navigate(redirectUrl || '/profile?tab=bookings');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, redirectUrl]);

  return (
    <>
      <Navbar />
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper 
          sx={{ 
            p: 3,
            backgroundColor: '#f0fff4',
            boxShadow: 3
          }}
        >
          <PaymentSuccess />
        </Paper>
      </Container>
    </>
  );
};

export default PaymentSuccessPage;
