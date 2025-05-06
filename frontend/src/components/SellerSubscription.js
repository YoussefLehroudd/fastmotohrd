import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableRow
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const SellerSubscription = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState({ show: false, message: '' });
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  const fetchSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch subscription data in parallel
      const [plansResponse, subscriptionResponse] = await Promise.all([
        fetch('http://localhost:5000/api/subscriptions/plans', {
          credentials: 'include'
        }),
        fetch('http://localhost:5000/api/subscriptions/current', {
          credentials: 'include'
        })
      ]);
      
      if (!plansResponse.ok) throw new Error('Failed to fetch plans');
      if (!subscriptionResponse.ok) throw new Error('Failed to fetch subscription');

      const [plansData, subscriptionData] = await Promise.all([
        plansResponse.json(),
        subscriptionResponse.json()
      ]);

      // Update state with fresh data
      setPlans(plansData);
      
      // Preserve rejected status when fetching new data
      if (currentSubscription?.status === 'rejected' && subscriptionData?.id === currentSubscription?.id) {
        setCurrentSubscription({
          ...subscriptionData,
          status: 'rejected'
        });
      } else {
        setCurrentSubscription(subscriptionData);
      }
      
      // Clear any previous errors
      setError(null);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    let socket;
    let retryCount = 0;
    const maxRetries = 3;
    let checkInterval;
    let isFetching = false;

    const checkSubscriptionStatus = async () => {
      const now = new Date();
      if (currentSubscription?.status === 'expired' || hasExpired) {
        // Clear the interval if subscription is already expired
        if (checkInterval) {
          clearInterval(checkInterval);
        }
        return;
      }

      if (currentSubscription) {
        let endDate;
        
        if (currentSubscription.is_trial && currentSubscription.trial_ends_at) {
          endDate = new Date(currentSubscription.trial_ends_at);
        } else if (currentSubscription.end_date) {
          endDate = new Date(currentSubscription.end_date);
        }

        if (endDate && now >= endDate) {
          // Mark as expired to prevent further checks
          setHasExpired(true);

          // Clear the interval to prevent repeated updates
          if (checkInterval) {
            clearInterval(checkInterval);
          }
          
          // Then fetch fresh data from server if not already fetching
          if (!isFetching) {
            isFetching = true;
            await fetchSubscriptionData();
            isFetching = false;
          }
        }
      }
    };

    const connectSocket = () => {
      socket = io('http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5
      });

      socket.on('connect', () => {
        console.log('Connected to subscription updates');
        retryCount = 0;
        fetchSubscriptionData();
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(fetchSubscriptionData, 1000 * retryCount);
        }
      });

      socket.on('subscription_update', async (data) => {
        if (!data.subscription) return;
        
        console.log('Subscription updated:', data);

        // Skip if subscription is already in the desired state
        if (currentSubscription?.status === data.subscription.status) {
          return;
        }

        // For expired subscriptions, only update if not already expired
        if (data.type === 'expired' && currentSubscription?.status === 'expired') {
          return;
        }

        // Update subscription data from server to ensure consistency
        await fetchSubscriptionData();
      });
    };

    // Initial fetch and socket connection
    fetchSubscriptionData();
    connectSocket();

    // Check subscription status every 30 seconds
    checkInterval = setInterval(checkSubscriptionStatus, 30000);

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [fetchSubscriptionData]);

  const handleSubscribe = async (planId) => {
    try {
      // Prevent subscribing if current subscription is rejected
      if (currentSubscription?.status === 'rejected') {
        setError('Your subscription request has been rejected. Please contact support for assistance.');
        return;
      }

      setLoading(true);
      const response = await fetch('http://localhost:5000/api/subscriptions/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ planId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to request subscription');
      }
      
      // Update subscription state with data from response
      if (data.subscription) {
        setCurrentSubscription(data.subscription);
      }
      
      // Show payment details
      setPaymentDetails(data.paymentDetails);
      setOpenDialog(true);
      
      // Show success message from response
      setSuccess({
        show: true,
        message: data.message
      });
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/subscriptions/start-trial', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to start trial');
      }
      
      // Refresh subscription data
      await fetchSubscriptionData();
      
      setSuccess({
        show: true,
        message: 'Free trial started successfully!'
      });
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success.show && (
          <Alert 
            severity="success"
            sx={{ 
              mb: 3,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              '& .MuiAlert-message': {
                textAlign: 'center'
              }
            }}
            onClose={() => setSuccess({ show: false, message: '' })}
          >
            {success.message}
          </Alert>
        )}

        {!currentSubscription && !loading && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Start with a Free Trial
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Try our platform for 7 days with 1 free listing
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleStartTrial}
            >
              Start Free Trial
            </Button>
          </Box>
        )}

        {currentSubscription && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Subscription
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="subtitle1">
                  Plan: {currentSubscription.plan_name}
                </Typography>
                <Chip 
                  label={currentSubscription.status} 
                  color={
                    currentSubscription.status === 'active' ? 'success' :
                    currentSubscription.status === 'pending' ? 'warning' :
                    'error'
                  }
                />
              </Box>
              {currentSubscription.status === 'rejected' && (
                <>
                  <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
                    Your subscription request has been rejected. Please contact support for assistance.
                  </Alert>
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => document.querySelector('button[class*="MuiFab-root"]').click()}
                    >
                      OPEN LIVE CHAT
                    </Button>
                  </Box>
                </>
              )}
              {currentSubscription.status === 'active' && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  {(() => {
                    const now = new Date();
                    const endDate = new Date(currentSubscription.is_trial ? 
                      currentSubscription.trial_ends_at : 
                      currentSubscription.end_date
                    );
                    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                    
                    if (daysLeft <= 7 && daysLeft > 0) {
                      return (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          Your subscription will expire in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. 
                          Please renew to continue using all features.
                        </Alert>
                      );
                    }
                    return null;
                  })()}
                </Box>
              )}
              {(currentSubscription.status === 'active' || currentSubscription.status === 'pending') && (
                <>
                  {currentSubscription.status === 'active' && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Listings Used: {currentSubscription.listings_used} / {currentSubscription.max_listings || '∞'}
                      </Typography>
                      {currentSubscription.end_date && (
                        <Typography variant="body2" color="text.secondary">
                          Expires: {new Date(currentSubscription.end_date).toLocaleDateString()}
                        </Typography>
                      )}
                    </>
                  )}
                  {currentSubscription.status === 'pending' && (
                    <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                      Your subscription request is pending approval. Please wait for admin confirmation.
                    </Alert>
                  )}
                </>
              )}
              {currentSubscription.is_trial === 1 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    You are currently on a free trial. You can upgrade to a paid plan at any time.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        <Typography variant="h6" sx={{ mb: 3 }}>
          Available Plans
        </Typography>
        <Grid container spacing={3}>
          {plans.filter(plan => !plan.name.includes('Free Trial')).map((plan) => (
            <Grid item xs={12} sm={6} md={4} key={plan.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {plan.name}
                  </Typography>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {plan.price} MAD
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {plan.duration_months} {plan.duration_months === 1 ? 'month' : 'months'}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {plan.max_listings ? `Up to ${plan.max_listings} listings` : 'Unlimited listings'}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={currentSubscription?.status === 'active' && currentSubscription?.plan_id === plan.id}
                    sx={{
                      backgroundColor: currentSubscription?.status === 'pending' && currentSubscription?.plan_id === plan.id ? '#ffa726' : undefined
                    }}
                  >
                    {currentSubscription?.status === 'rejected' ? 'OPEN LIVE CHAT' :
                     currentSubscription?.plan_id === plan.id ? 
                      currentSubscription.status === 'pending' ? 'PENDING' : 'CURRENT PLAN' 
                      : 'SUBSCRIBE'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent>
          {paymentDetails && (
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell><strong>Amount</strong></TableCell>
                  <TableCell>{paymentDetails.amount} MAD</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Bank Name</strong></TableCell>
                  <TableCell>{paymentDetails.bankName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Account Number</strong></TableCell>
                  <TableCell>{paymentDetails.accountNumber}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Beneficiary</strong></TableCell>
                  <TableCell>{paymentDetails.beneficiary}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            {paymentDetails?.instructions}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SellerSubscription;
