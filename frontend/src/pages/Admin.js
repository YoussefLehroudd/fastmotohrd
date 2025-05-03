import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import AdminNavbar from '../components/admin/AdminNavbar';
import AdminStats from '../components/admin/AdminStats';
import UserManagement from '../components/admin/UserManagement';
import MotorManagement from '../components/admin/MotorManagement';
import BookingManagement from '../components/admin/BookingManagement';
import AdminChat from '../components/admin/AdminChat';
import SubscriptionManagement from '../components/admin/SubscriptionManagement';
import BankDetailsManagement from '../components/admin/BankDetailsManagement';

const Admin = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState({ data: [], pagination: {} });
  const [motors, setMotors] = useState({ data: [], pagination: {} });
  const [bookings, setBookings] = useState({ data: [], pagination: {} });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for admin access and valid authentication
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      console.error('Access denied: User is not an admin', { userRole: user.role });
      navigate('/');
      return;
    }

    // Verify Google authentication if applicable
    if (user.google_id) {
      console.log('Admin authenticated via Google:', { email: user.email });
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([
          fetchStats(),
          fetchUsers(),
          fetchMotors(),
          fetchBookings(),
          fetchRecentData()
        ]);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleError = (err) => {
    const message = err.response?.data?.message || err.message;
    const errorDetails = err.response?.data?.error;
    setError(errorDetails ? `${message}: ${errorDetails}` : message);
    
    // Enhanced error handling for authentication issues
    const authErrors = [
      'Access denied. Admin only.',
      'Authentication required',
      'Admin access required',
      'Invalid token',
      'Unauthorized email domain for admin access'
    ];
    
    if (authErrors.includes(message)) {
      console.error('Admin authentication error:', {
        message,
        details: errorDetails,
        user: user?.email,
        isGoogleAuth: !!user?.google_id
      });
      
      // Clear user session and redirect to login
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }
    
    // Log non-auth errors for debugging
    console.error('Admin dashboard error:', {
      message,
      details: errorDetails,
      status: err.response?.status,
      endpoint: err.config?.url,
      user: user?.email
    });
  };

  const fetchStats = async () => {
    try {
      setError(null); // Clear previous errors
      const { data } = await axios.get('http://localhost:5000/api/admin/stats', {
        withCredentials: true
      });
      if (data) {
        setStats(data);
      } else {
        throw new Error('No data received from server');
      }
    } catch (err) {
      handleError(err);
    }
  };

  const fetchRecentData = async () => {
    try {
      setError(null); // Clear previous errors
      const [usersData, bookingsData] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/users?page=1&limit=5', {
          withCredentials: true
        }),
        axios.get('http://localhost:5000/api/admin/bookings?page=1&limit=5', {
          withCredentials: true
        })
      ]);
      
      if (usersData.data?.users) {
        setRecentUsers(usersData.data.users);
      }
      
      if (bookingsData.data?.bookings) {
        setRecentBookings(bookingsData.data.bookings);
      }
    } catch (err) {
      handleError(err);
    }
  };

  const fetchUsers = async (page = 1, search = '', role = '', limit = 10) => {
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/admin/users?page=${page}&limit=${limit}&search=${search}&role=${role}`,
        { withCredentials: true }
      );
      setUsers({ data: data.users, pagination: data.pagination });
    } catch (err) {
      handleError(err);
    }
  };

  const fetchMotors = async (page = 1, search = '', status = '', type = '', limit = 10) => {
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/admin/motors?page=${page}&limit=${limit}&search=${search}&status=${status}&type=${type}`,
        { withCredentials: true }
      );
      setMotors({ data: data.motors, pagination: data.pagination });
    } catch (err) {
      handleError(err);
    }
  };

  const fetchBookings = async (page = 1, search = '', status = '', limit = 10) => {
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/admin/bookings?page=${page}&limit=${limit}&search=${search}&status=${status}`,
        { withCredentials: true }
      );
      setBookings({ data: data.bookings, pagination: data.pagination });
    } catch (err) {
      handleError(err);
    }
  };

  const handleUserStatusUpdate = async (userId, isBlocked) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/admin/users/${userId}/status`,
        { isBlocked },
        { withCredentials: true }
      );
      await Promise.all([fetchUsers(), fetchStats()]);
    } catch (err) {
      handleError(err);
    }
  };

  const handleUserRoleUpdate = async (userId, role) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/admin/users/${userId}/role`,
        { role },
        { withCredentials: true }
      );
      await Promise.all([fetchUsers(), fetchStats()]);
    } catch (err) {
      handleError(err);
    }
  };

  const renderDashboard = () => (
    <Box>
      <AdminStats stats={stats} />
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Users</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Joined</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Bookings</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Motor</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.motorTitle}</TableCell>
                      <TableCell>{booking.userName}</TableCell>
                      <TableCell>{booking.status}</TableCell>
                      <TableCell>
                        {new Date(booking.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return renderDashboard();
      case 1:
        return (
          <UserManagement
            users={users.data}
            pagination={users.pagination}
            onPageChange={(page, limit) => fetchUsers(page, '', '', limit)}
            onSearch={(term) => fetchUsers(1, term)}
            onRoleFilter={(role) => fetchUsers(1, '', role)}
            onUpdateStatus={handleUserStatusUpdate}
            onUpdateRole={handleUserRoleUpdate}
          />
        );
      case 2:
        return (
          <MotorManagement
            motors={motors.data}
            pagination={motors.pagination}
            onPageChange={(page, limit) => fetchMotors(page, '', '', '', limit)}
            onSearch={(term) => fetchMotors(1, term)}
            onStatusFilter={(status) => fetchMotors(1, '', status)}
            onTypeFilter={(type) => fetchMotors(1, '', '', type)}
          />
        );
      case 3:
        return (
          <BookingManagement
            bookings={bookings.data}
            pagination={bookings.pagination}
            onPageChange={(page, limit) => fetchBookings(page, '', '', limit)}
            onSearch={(term) => fetchBookings(1, term)}
            onStatusFilter={(status) => fetchBookings(1, '', status)}
          />
        );
      case 4:
        return <BankDetailsManagement />;
      case 5:
        return <SubscriptionManagement />;
      case 6:
        return <AdminChat />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AdminNavbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: '#f5f5f5',
          minHeight: '100vh'
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {renderContent()}
      </Box>
    </Box>
  );
};

export default Admin;
