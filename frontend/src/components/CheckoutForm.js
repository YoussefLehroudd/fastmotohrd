import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button, Box, Alert, CircularProgress } from '@mui/material';
import PaymentSuccess from './PaymentSuccess';

const CheckoutForm = ({ bookingId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { paymentIntent, error } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required'
      });

      if (error) {
        setError(error.message);
        setProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Redirect to success page
        window.location.href = '/payment-success?redirect=/profile?tab=bookings';
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      setProcessing(false);
    }
  };

  if (paymentSuccess) {
    return <PaymentSuccess />;
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
      
      <Box sx={{ mb: 3 }}>
        <PaymentElement />
      </Box>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={!stripe || processing}
        sx={{ py: 1.5 }}
      >
        {processing ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'Pay Now'
        )}
      </Button>
    </form>
  );
};

export default CheckoutForm;
