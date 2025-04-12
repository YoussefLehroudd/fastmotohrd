import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const MotorBookings = ({ motorId }) => {
  const [bookings, setBookings] = useState([]);
  const [locations, setLocations] = useState([]);
  const [openLocationDialog, setOpenLocationDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [locationForm, setLocationForm] = useState({
    city: '',
    address: ''
  });

  const fetchBookings = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/motor/${motorId}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings');
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/motors/${motorId}/locations`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setError('Failed to load locations');
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchLocations();
  }, [motorId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddLocation = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/motors/${motorId}/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(locationForm)
      });

      if (!response.ok) {
        throw new Error('Failed to add location');
      }

      setSuccess('Location added successfully!');
      fetchLocations();
      setOpenLocationDialog(false);
      setLocationForm({ city: '', address: '' });
    } catch (error) {
      console.error('Error adding location:', error);
      setError('Failed to add location');
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      setSuccess('Booking status updated successfully!');
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      setError('Failed to update booking status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'success';
      case 'cancelled': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Rental Locations
        </Typography>
        <Button
          variant="outlined"
          startIcon={<LocationIcon />}
          onClick={() => setOpenLocationDialog(true)}
          sx={{ mb: 2 }}
        >
          Add New Location
        </Button>
        <Grid container spacing={2}>
          {locations.map((location) => (
            <Grid item xs={12} sm={6} md={4} key={location.id}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    {location.city}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {location.address}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Typography variant="h6" gutterBottom>
        Bookings
      </Typography>
      <Grid container spacing={2}>
        {bookings.map((booking) => (
          <Grid item xs={12} sm={6} md={4} key={booking.id}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1">
                    Booking #{booking.id}
                  </Typography>
                  <Chip 
                    label={booking.status} 
                    color={getStatusColor(booking.status)}
                    size="small"
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <CalendarIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                  {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <LocationIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                  {booking.locationDisplay || 'Location not available'}
                </Typography>
                <Typography variant="subtitle2" color="primary">
                  Total: {booking.totalPrice} MAD
                </Typography>
                
                {booking.status === 'pending' && (
                  <Stack direction="row" spacing={1} mt={2}>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<CheckIcon />}
                      onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      startIcon={<CloseIcon />}
                      onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add Location Dialog */}
      <Dialog open={openLocationDialog} onClose={() => setOpenLocationDialog(false)}>
        <DialogTitle>Add New Location</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="City"
            fullWidth
            value={locationForm.city}
            onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Address"
            fullWidth
            multiline
            rows={3}
            value={locationForm.address}
            onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLocationDialog(false)}>Cancel</Button>
          <Button onClick={handleAddLocation} variant="contained" color="primary">
            Add Location
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MotorBookings;
