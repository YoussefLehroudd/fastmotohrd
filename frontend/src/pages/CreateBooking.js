import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardMedia,
  CardContent,
  Divider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimeField } from '@mui/x-date-pickers/TimeField';
import {
  DirectionsBike as BikeIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';

const CreateBooking = () => {
  const { motorId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [motorDetails, setMotorDetails] = useState(null);
  const [locations, setLocations] = useState([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const [bookingData, setBookingData] = useState({
    startDate: null,
    endDate: null,
    pickupTime: null,
    returnTime: null,
    locationId: '',
    specialRequests: '',
    paymentMethod: 'cash_on_delivery'
  });

  const [totalDays, setTotalDays] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    fetchMotorDetails();
  }, [motorId]);

  const fetchMotorDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`http://localhost:5000/api/motors/${motorId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch motor details');
      }

      const data = await response.json();
      
      // Prevent booking if motor is not active or not available for rent
      if (!data.isActive || !data.isAvailableForRent) {
        throw new Error('This motorcycle is not available for booking');
      }
      
      setMotorDetails(data);

      // Fetch locations for this motor
      const locationsResponse = await fetch(`http://localhost:5000/api/motors/${motorId}/locations`, {
        credentials: 'include'
      });

      if (!locationsResponse.ok) {
        throw new Error('Failed to fetch locations');
      }

      const locationsData = await locationsResponse.json();
      setLocations(locationsData);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingData.startDate && bookingData.endDate) {
      const start = new Date(bookingData.startDate);
      const end = new Date(bookingData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTotalDays(diffDays);
      setTotalPrice(diffDays * (motorDetails?.dailyRate || 0));
    }
  }, [bookingData.startDate, bookingData.endDate, motorDetails?.dailyRate]);

  const handleChange = (field) => (value) => {
    if (field === 'startDate' || field === 'endDate') {
      // For date fields, ensure we have a valid Date object and normalize to UTC midnight
      const dateValue = value ? new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())) : null;
      setBookingData(prev => ({
        ...prev,
        [field]: dateValue
      }));
    } else {
      setBookingData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateBooking = () => {
    if (!bookingData.startDate || !bookingData.endDate) {
      setError('Please select both start and end dates');
      return false;
    }
    if (!bookingData.pickupTime || !bookingData.returnTime) {
      setError('Please select both pickup and return times');
      return false;
    }
    if (!bookingData.locationId) {
      setError('Please select a pickup/return location');
      return false;
    }
    if (!bookingData.paymentMethod) {
      setError('Please select a payment method');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Create booking with status based on payment method
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          motorId,
          ...bookingData,
          startDate: bookingData.startDate.toISOString().split('T')[0],
          endDate: bookingData.endDate.toISOString().split('T')[0],
          pickupTime: bookingData.pickupTime.replace(/\s/g, ''),
          returnTime: bookingData.returnTime.replace(/\s/g, ''),
          totalPrice,
          // All new bookings start with pending status
          status: 'pending'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.type === 'UNAVAILABLE_NO_ALTERNATIVES') {
          setError('This motorcycle and all identical alternatives are not available for the selected dates. Please try different dates.');
        } else {
          throw new Error(error.message || 'Failed to create booking');
        }
        return;
      }

      const booking = await response.json();

      if (bookingData.paymentMethod === 'cash_on_delivery') {
        // For cash on delivery, show success message and redirect to profile
        setSuccess('Booking created successfully! You will be notified when the seller accepts your booking.');
        setTimeout(() => {
          navigate(`/profile?tab=bookings`);
        }, 2000);
      } else {
        // For Stripe payment, create checkout session and redirect
        const stripeResponse = await fetch('http://localhost:5000/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            bookingId: booking.bookingId,
            totalPrice,
            motorTitle: motorDetails.title
          })
        });

        if (!stripeResponse.ok) {
          throw new Error('Failed to process payment');
        }

        const { url } = await stripeResponse.json();
        window.location.href = url; // Redirect to Stripe Checkout
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
    }
  };

  if (loading && !motorDetails) {
    return (
      <>
        <Navbar />
        <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Create Booking
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <Grid container>
                      <Grid item xs={12} md={4}>
                        <CardMedia
                          component="img"
                          height="200"
                          image={`http://localhost:5000${motorDetails?.imageUrl}`}
                          alt={motorDetails?.title}
                          sx={{ objectFit: 'cover' }}
                        />
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {motorDetails?.title}
                          </Typography>
                          {(motorDetails?.brand || motorDetails?.model || motorDetails?.year) && (
                            <Typography color="text.secondary" gutterBottom>
                              {motorDetails?.brand} {motorDetails?.model} {motorDetails?.year && `(${motorDetails.year})`}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {motorDetails?.description}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <BikeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              Daily Rate: {motorDetails?.dailyRate} MAD
                            </Typography>
                          </Box>
                        </CardContent>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date"
                      value={bookingData.startDate}
                      onChange={handleChange('startDate')}
                      minDate={new Date()}
                      sx={{ width: '100%' }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End Date"
                      value={bookingData.endDate}
                      onChange={handleChange('endDate')}
                      minDate={bookingData.startDate || new Date()}
                      sx={{ width: '100%' }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Pickup Time</InputLabel>
                    <Select
                      value={bookingData.pickupTime || ''}
                      onChange={(e) => handleChange('pickupTime')(e.target.value)}
                      label="Pickup Time"
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <MenuItem key={`${hour}:00`} value={`${hour}:00:00`}>
                            {`${hour}:00`}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Return Time</InputLabel>
                    <Select
                      value={bookingData.returnTime || ''}
                      onChange={(e) => handleChange('returnTime')(e.target.value)}
                      label="Return Time"
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <MenuItem key={`${hour}:00`} value={`${hour}:00:00`}>
                            {`${hour}:00`}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  {locations.length > 0 ? (
                    <FormControl fullWidth>
                      <InputLabel>Pickup/Return Location</InputLabel>
                      <Select
                        value={bookingData.locationId}
                        onChange={(e) => handleChange('locationId')(e.target.value)}
                        label="Pickup/Return Location"
                      >
                        {locations.map((location) => (
                          <MenuItem key={location.id} value={location.id}>
                            {location.city} {location.address ? `- ${location.address}` : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Alert severity="warning">
                      This motorcycle doesn't have any pickup locations yet. Please contact the seller to add a location before booking.
                    </Alert>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Payment Method
                  </Typography>
                  <FormControl component="fieldset">
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Paper 
                          sx={{ 
                            p: 2, 
                            cursor: 'pointer',
                            border: bookingData.paymentMethod === 'cash_on_delivery' ? '2px solid #1a237e' : '1px solid #e0e0e0'
                          }}
                          onClick={() => handleChange('paymentMethod')('cash_on_delivery')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <input
                              type="radio"
                              checked={bookingData.paymentMethod === 'cash_on_delivery'}
                              onChange={() => handleChange('paymentMethod')('cash_on_delivery')}
                            />
                            <Box sx={{ ml: 2 }}>
                              <Typography variant="subtitle2">Cash on Delivery</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Pay in cash when you pick up the motorcycle
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={12}>
                        <Paper 
                          sx={{ 
                            p: 2, 
                            cursor: 'pointer',
                            border: bookingData.paymentMethod === 'stripe' ? '2px solid #1a237e' : '1px solid #e0e0e0'
                          }}
                          onClick={() => handleChange('paymentMethod')('stripe')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <input
                              type="radio"
                              checked={bookingData.paymentMethod === 'stripe'}
                              onChange={() => handleChange('paymentMethod')('stripe')}
                            />
                            <Box sx={{ ml: 2 }}>
                              <Typography variant="subtitle2">Credit/Debit Card</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Pay securely with your credit/debit card via Stripe
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={12}>
                        <Paper 
                          sx={{ 
                            p: 2, 
                            opacity: 0.5,
                            cursor: 'not-allowed'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <input
                              type="radio"
                              disabled
                            />
                            <Box sx={{ ml: 2 }}>
                              <Typography variant="subtitle2">Bank Transfer (Coming Soon)</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Pay via bank transfer
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Special Requests"
                    multiline
                    rows={4}
                    fullWidth
                    value={bookingData.specialRequests}
                    onChange={(e) => handleChange('specialRequests')(e.target.value)}
                    placeholder="Any special requests or notes for your booking..."
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" gutterBottom>
                Booking Summary
              </Typography>
              
              <Box sx={{ my: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Duration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {totalDays} days
                </Typography>
              </Box>

              <Box sx={{ my: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Daily Rate
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {motorDetails?.dailyRate} MAD
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ my: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Total Price
                </Typography>
                <Typography variant="h5" color="primary">
                  {totalPrice} MAD
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={() => {
                  if (validateBooking()) {
                    setConfirmDialogOpen(true);
                  }
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Confirm Booking'}
              </Button>
            </Paper>
          </Grid>
        </Grid>

        <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
          <DialogTitle>Confirm Booking</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Please review your booking details:
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Duration:</strong> {totalDays} days
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Total Price:</strong> {totalPrice} MAD
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Start Date:</strong> {bookingData.startDate?.toLocaleDateString()}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>End Date:</strong> {bookingData.endDate?.toLocaleDateString()}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Pickup Time:</strong> {bookingData.pickupTime}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Return Time:</strong> {bookingData.returnTime}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Payment Method:</strong> {
                  bookingData.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 
                  bookingData.paymentMethod === 'stripe' ? 'Credit/Debit Card' : ''
                }
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} color="primary" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default CreateBooking;
