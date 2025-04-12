import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusAlert, setStatusAlert] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Helper function to split location into city and address
  const splitLocation = (location) => {
    if (!location) return { city: '', address: '' };
    const [city, address] = location.split(',').map(part => part.trim());
    return { city, address };
  };

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const query = new URLSearchParams({
        page,
        limit: 10,
        ...(selectedStatus && { status: selectedStatus })
      }).toString();

      const response = await fetch(`http://localhost:5000/api/users/bookings?${query}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      
      // Check for status changes
      if (bookings.length > 0) {
        data.bookings.forEach(newBooking => {
          const oldBooking = bookings.find(b => b.id === newBooking.id);
          if (oldBooking && oldBooking.status !== newBooking.status) {
            const statusMessage = {
              confirmed: 'Your booking has been accepted by the seller!',
              cancelled: 'Your booking has been cancelled.',
              completed: 'Your booking has been completed.'
            }[newBooking.status];
            
            if (statusMessage) {
              setStatusAlert(statusMessage);
              setTimeout(() => setStatusAlert(''), 5000); // Clear after 5 seconds
            }
          }
        });
      }
      
      setBookings(data.bookings);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [page, selectedStatus]);

  // Poll for booking updates every 30 seconds
  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [page, selectedStatus, fetchBookings]);

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleViewDetails = async (bookingId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/users/bookings/${bookingId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch booking details');
      }

      const booking = await response.json();
      setSelectedBooking(booking);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    try {
      setCancelLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/bookings/${selectedBooking.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ 
            status: 'cancelled',
            reason: cancellationReason 
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel booking');
      }

      const result = await response.json();
      
      // Update the booking status in the list
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === selectedBooking.id 
            ? { ...booking, status: 'cancelled' }
            : booking
        )
      );

      setStatusAlert('Booking cancelled successfully');
      setCancelDialogOpen(false);
      setCancellationReason('');
    } catch (error) {
      setError(error.message);
    } finally {
      setCancelLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !bookings.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {statusAlert && (
        <Alert 
          severity={statusAlert.includes('successfully') ? 'success' : statusAlert.includes('cancelled') ? 'error' : 'info'} 
          sx={{ mb: 2 }}
        >
          {statusAlert}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            My Bookings
          </Typography>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={selectedStatus}
              onChange={handleStatusChange}
              label="Filter by Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={3}>
          {bookings.map((booking) => (
            <Grid item xs={12} key={booking.id}>
              <Card>
                <Grid container>
                  <Grid item xs={12} md={4}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={`http://localhost:5000${booking.motorImage}`}
                      alt={booking.motorTitle}
                      sx={{ objectFit: 'cover' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Typography variant="h6" component="div">
                          {booking.motorTitle}
                        </Typography>
                        <Chip
                          label={(!booking.status || booking.status === 'rejected') ? 'Cancelled' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          sx={{
                            bgcolor: (!booking.status || booking.status === 'rejected' || booking.status === 'cancelled') ? '#d32f2f' : 
                                    booking.status === 'pending' ? '#ed6c02' :
                                    booking.status === 'confirmed' ? '#0288d1' :
                                    booking.status === 'completed' ? '#2e7d32' : undefined,
                            color: 'white'
                          }}
                        />
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {new Date(new Date(booking.startDate).getTime() + (24 * 60 * 60 * 1000)).toISOString().split('T')[0]} - {new Date(new Date(booking.endDate).getTime() + (24 * 60 * 60 * 1000)).toISOString().split('T')[0]}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            Pickup: {formatTime(booking.pickupTime)} | Return: {formatTime(booking.returnTime)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {booking.location ? `${splitLocation(booking.location).city}, ${splitLocation(booking.location).address}` : 'Location not specified'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PaymentIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            Total: {booking.totalPrice} MAD | Status: {booking.paymentStatus}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={() => handleViewDetails(booking.id)}
                        >
                          View Details
                        </Button>
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setCancelDialogOpen(true);
                            }}
                          >
                            Cancel Booking
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          ))}
        </Grid>

        {totalPages > 1 && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Booking Details Dialog */}
      <Dialog
        open={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedBooking && (
          <>
            <DialogTitle>
              Booking Details
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">{selectedBooking.motorTitle}</Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {selectedBooking.brand} {selectedBooking.model} ({selectedBooking.year})
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Booking Period</Typography>
                  <Typography gutterBottom>
                    {formatDate(selectedBooking.startDate)} - {formatDate(selectedBooking.endDate)}
                  </Typography>
                  
                  <Typography variant="subtitle2">Pickup/Return Time</Typography>
                  <Typography gutterBottom>
                    {formatTime(selectedBooking.pickupTime)} - {formatTime(selectedBooking.returnTime)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Location</Typography>
                  <Typography gutterBottom>
                    {selectedBooking.location ? `${splitLocation(selectedBooking.location).city}, ${splitLocation(selectedBooking.location).address}` : 'Location not specified'}
                  </Typography>
                  
                  <Typography variant="subtitle2">Payment Status</Typography>
                  <Typography gutterBottom>{selectedBooking.paymentStatus}</Typography>
                </Grid>

                {selectedBooking.pickupInstructions && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Pickup Instructions</Typography>
                    <Typography>{selectedBooking.pickupInstructions}</Typography>
                  </Grid>
                )}

                {selectedBooking.specialRequests && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Special Requests</Typography>
                    <Typography>{selectedBooking.specialRequests}</Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedBooking(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Cancel Booking Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to cancel this booking? This action cannot be undone.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Cancellation"
            fullWidth
            multiline
            rows={3}
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>No, Keep Booking</Button>
          <Button 
            onClick={handleCancelBooking}
            color="error"
            disabled={!cancellationReason.trim() || cancelLoading}
          >
            {cancelLoading ? <CircularProgress size={24} /> : 'Yes, Cancel Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserBookings;
