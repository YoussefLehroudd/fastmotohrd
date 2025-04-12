import React from 'react';
import { Box, Card, CardContent, Grid, Typography, Divider } from '@mui/material';
import { 
  People as PeopleIcon,
  TwoWheeler as MotorIcon,
  BookOnline as BookingIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Store as StoreIcon,
  SupervisorAccount as AdminIcon
} from '@mui/icons-material';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Card sx={{ height: '100%', backgroundColor: color, color: 'white' }}>
    <CardContent>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Icon sx={{ fontSize: 40 }} />
        </Grid>
        <Grid item>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          <Typography variant="h4">
            {value}
          </Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

const DetailCard = ({ title, details }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" gutterBottom color="primary">
        {title}
      </Typography>
      <Divider sx={{ my: 1 }} />
      {details.map((detail, index) => (
        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
          <Typography variant="body1" color="textSecondary">
            {detail.label}
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {detail.value}
          </Typography>
        </Box>
      ))}
    </CardContent>
  </Card>
);

const AdminStats = ({ stats }) => {
  if (!stats) return null;

  const {
    users = {},
    motors = {},
    bookings = {},
    payments = {},
    recentActivity = {}
  } = stats;

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Main Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={users.total || 0}
            icon={PeopleIcon}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Motors"
            value={motors.available || 0}
            icon={MotorIcon}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Bookings"
            value={bookings.total || 0}
            icon={BookingIcon}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`${(payments.totalAmount || 0).toLocaleString()} MAD`}
            icon={PaymentIcon}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Detailed Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <DetailCard
            title="User Statistics"
            details={[
              { label: 'Regular Users', value: users.regularUsers || 0 },
              { label: 'Sellers', value: users.sellers || 0 },
              { label: 'Admins', value: users.admins || 0 },
              { label: 'New Users (Today)', value: users.newToday || 0 },
              { label: 'Active Users', value: users.active || 0 }
            ]}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DetailCard
            title="Motor Statistics"
            details={[
              { label: 'Total Motors', value: motors.total || 0 },
              { label: 'Available', value: motors.available || 0 },
              { label: 'Currently Rented', value: motors.rented || 0 },
              { label: 'Average Daily Rate', value: `${(motors.avgDailyRate || 0).toFixed(2)} MAD` }
            ]}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DetailCard
            title="Booking Statistics"
            details={[
              { label: 'Pending Bookings', value: bookings.pending || 0 },
              { label: 'Active Bookings', value: bookings.active || 0 },
              { label: 'Completed Today', value: bookings.completedToday || 0 },
              { label: 'Total Revenue Today', value: `${(payments.todayAmount || 0).toLocaleString()} MAD` },
              { label: 'Avg. Booking Value', value: `${(payments.avgBookingValue || 0).toFixed(2)} MAD` }
            ]}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminStats;
