import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert
} from '@mui/material';
import Navbar from '../components/Navbar';
import CheckoutForm from '../components/CheckoutForm';

const stripePromise = loadStripe('pk_test_51PL20OC1IAw1LABdXXwuqwTyPZOgwxjgwMzPQQUxKzELWwxDvXhSVLMFRkQr5Q9WNFhNXbjQBcbvTXjPqKgVxVYX00ufNJWwmK');

const Payment = () => {
  const [searchParams] = useSearchParams();
  const clientSecret = searchParams.get('clientSecret');
  const bookingId = searchParams.get('bookingId');

  if (!clientSecret || !bookingId) {
    return (
      <>
        <Navbar />
        <Container maxWidth="sm" sx={{ mt: 4 }}>
          <Alert severity="error">Invalid payment session</Alert>
        </Container>
      </>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#1976d2'
      }
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom align="center">
            Complete Your Payment
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm bookingId={bookingId} />
            </Elements>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default Payment;
