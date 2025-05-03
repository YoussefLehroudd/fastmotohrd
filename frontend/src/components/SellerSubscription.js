import React, { useState, useEffect } from 'react';
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
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subscription plans
        const plansResponse = await fetch('http://localhost:5000/api/subscriptions/plans', {
          credentials: 'include'
        });
        
        if (!plansResponse.ok) throw new Error('Failed to fetch plans');
        const plansData = await plansResponse.json();
        setPlans(plansData);

        // Fetch current subscription
        const subscriptionResponse = await fetch('http://localhost:5000/api/subscriptions/current', {
          credentials: 'include'
        });
        
        if (!subscriptionResponse.ok) throw new Error('Failed to fetch subscription');
        const subscriptionData = await subscriptionResponse.json();
        setCurrentSubscription(subscriptionData);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubscribe = async (planId) => {
    try {
      const response = await fetch('http://localhost:5000/api/subscriptions/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ planId })
      });

      if (!response.ok) throw new Error('Failed to request subscription');
      
      const data = await response.json();
      setPaymentDetails(data.paymentDetails);
      setOpenDialog(true);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleStartTrial = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/subscriptions/start-trial', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to start trial');
      
      const data = await response.json();
      // Refresh current subscription
      const subscriptionResponse = await fetch('http://localhost:5000/api/subscriptions/current', {
        credentials: 'include'
      });
      
      if (!subscriptionResponse.ok) throw new Error('Failed to fetch subscription');
      const subscriptionData = await subscriptionResponse.json();
      setCurrentSubscription(subscriptionData);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
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
                  color={currentSubscription.status === 'active' ? 'success' : 'warning'}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Listings Used: {currentSubscription.listings_used} / {currentSubscription.max_listings || '∞'}
              </Typography>
              {currentSubscription.end_date && (
                <Typography variant="body2" color="text.secondary">
                  Expires: {new Date(currentSubscription.end_date).toLocaleDateString()}
                </Typography>
              )}
            </CardContent>
          </Card>
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

        <Typography variant="h6" gutterBottom>
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
                    disabled={currentSubscription?.plan_id === plan.id}
                    sx={{
                      backgroundColor: currentSubscription?.plan_id === plan.id ? '#e0e0e0' : undefined
                    }}
                  >
                    {currentSubscription?.plan_id === plan.id ? 'CURRENT PLAN' : 'SUBSCRIBE'}
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
