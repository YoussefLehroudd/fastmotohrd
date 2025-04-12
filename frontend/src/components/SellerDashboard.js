import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  DirectionsBike as BikeIcon,
  CalendarToday as CalendarIcon,
  Star as StarIcon
} from '@mui/icons-material';
import axios from 'axios';

const SellerDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalMotors: 0,
      activeBookings: 0,
      totalRevenue: 0,
      averageRating: 0
    },
    recentBookings: []
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/seller/stats', {
          withCredentials: true
        });
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const fetchBookingDetails = async (bookingId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/bookings/${bookingId}`,
        { withCredentials: true }
      );
      setBookingDetails(response.data);
      setDetailsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching booking details:', error);
    }
  };

  const handleRowClick = (booking) => {
    setSelectedBooking(booking);
    fetchBookingDetails(booking.id);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <BikeIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Motors
                  </Typography>
                  <Typography variant="h6">
                    {Number(dashboardData.stats.totalMotors || 0)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <CalendarIcon color="secondary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Active Bookings
                  </Typography>
                  <Typography variant="h6">
                    {Number(dashboardData.stats.activeBookings || 0)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <TrendingUpIcon color="success" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                  <Typography variant="h6">
                    {(dashboardData.stats.totalRevenue || 0).toLocaleString()} MAD
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <StarIcon color="warning" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                  <Typography variant="h6">
                    {parseFloat(dashboardData.stats.averageRating || 0).toFixed(1)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Bookings Table */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Motor</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dashboardData.recentBookings.map((booking) => (
                <TableRow 
                  key={booking.id}
                  onClick={() => handleRowClick(booking)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <TableCell>{new Date(booking.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{booking.motorName}</TableCell>
                  <TableCell>{booking.customerName}</TableCell>
                  <TableCell>{(booking.totalPrice || 0).toLocaleString()} MAD</TableCell>
                  <TableCell>
                    <Chip
                      label={booking.status.toUpperCase()}
                      color={getStatusColor(booking.status)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {/* Booking Details Dialog */}
      <Dialog
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          Booking Details
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {bookingDetails && (
            <Grid container spacing={3}>
              {/* Top Row */}
              <Grid container item xs={12} spacing={3}>
                {/* Booking Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Booking Information</Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography><strong>Booking ID:</strong> #{bookingDetails.id}</Typography>
                    <Typography><strong>Start Date:</strong> {new Date(bookingDetails.startDate).toLocaleDateString()}</Typography>
                    <Typography><strong>End Date:</strong> {new Date(bookingDetails.endDate).toLocaleDateString()}</Typography>
                    <Typography><strong>Days:</strong> {Math.ceil((new Date(bookingDetails.endDate) - new Date(bookingDetails.startDate)) / (1000 * 60 * 60 * 24))}</Typography>
                    <Typography><strong>Total Price:</strong> {bookingDetails.totalPrice} MAD</Typography>
                    <Typography><strong>Status:</strong> {bookingDetails.status}</Typography>
                  </Box>
                </Grid>

                {/* Customer Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Customer Information</Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography><strong>Name:</strong> {bookingDetails.customerName}</Typography>
                    <Typography><strong>Email:</strong> {bookingDetails.customerEmail}</Typography>
                    <Typography><strong>Phone:</strong> {bookingDetails.customerPhone}</Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Middle Row */}
              <Grid container item xs={12} spacing={3}>
                {/* Left Side - Motorcycle Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Motorcycle Information</Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography><strong>Name:</strong> {bookingDetails.motorName}</Typography>
                    <Typography><strong>Brand:</strong> {bookingDetails.brand}</Typography>
                    <Typography><strong>Model:</strong> {bookingDetails.model}</Typography>
                    {bookingDetails.imageUrl && (
                      <Box sx={{ mt: 2 }}>
                        <img 
                          src={`http://localhost:5000${bookingDetails.imageUrl}`}
                          alt={bookingDetails.motorName}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            objectFit: 'contain'
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Grid>

                {/* Right Side */}
                <Grid item xs={12} md={6}>
                  {/* Pickup Location */}
                  {bookingDetails.location && (
                    <>
                      <Typography variant="h6" gutterBottom>Pickup Location</Typography>
                      <Box sx={{ mb: 3 }}>
                        <Typography><strong>Location:</strong> {bookingDetails.location}</Typography>
                      </Box>
                    </>
                  )}

                  {/* Payment Information */}
                  {bookingDetails.paymentMethod && (
                    <>
                      <Typography variant="h6" gutterBottom>Payment Information</Typography>
                      <Box sx={{ mb: 3 }}>
                        <Typography><strong>Payment Method:</strong> {bookingDetails.paymentMethod}</Typography>
                        <Typography><strong>Payment Status:</strong> {bookingDetails.paymentStatus}</Typography>
                      </Box>
                    </>
                  )}
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2 }}>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellerDashboard;
