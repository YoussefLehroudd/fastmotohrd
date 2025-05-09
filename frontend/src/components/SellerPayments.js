import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Card,
  CardContent,
  Grid,
  Button,
  TablePagination
} from '@mui/material';
import axios from 'axios';

const SellerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: "0.00",
    monthlyRevenue: "0.00",
    weeklyRevenue: "0.00",
    dailyRevenue: "0.00",
    pendingPayments: "0.00",
    completedPayments: "0.00"
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchPayments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/payments', {
        withCredentials: true
      });
      setPayments(response.data.transactions);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleDelete = async (paymentId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/payments/${paymentId}`,
        { withCredentials: true }
      );
      fetchPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const handleValidate = async (paymentId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/payments/${paymentId}/validate`,
        {},
        { withCredentials: true }
      );
      fetchPayments();
    } catch (error) {
      console.error('Error validating payment:', error);
    }
  };

  const getStatusChip = (status) => {
    const statusColors = {
      pending: 'warning',
      validated: 'success',
      rejected: 'error'
    };

    return (
      <Chip 
        label={status.toUpperCase()} 
        color={statusColors[status] || 'default'}
        size="small"
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Pending Payments
              </Typography>
              <Typography variant="h3" component="div" color="primary">
                {parseFloat(stats.pendingPayments).toFixed(2)} MAD
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Completed Payments
              </Typography>
              <Typography variant="h3" component="div" color="success.main">
                {parseFloat(stats.completedPayments).toFixed(2)} MAD
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Today
              </Typography>
              <Typography variant="h3" component="div" color="text.primary">
                {parseFloat(stats.dailyRevenue || 0).toFixed(2)} MAD
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                This Week
              </Typography>
              <Typography variant="h3" component="div" color="text.primary">
                {parseFloat(stats.weeklyRevenue || 0).toFixed(2)} MAD
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                This Month
              </Typography>
              <Typography variant="h3" component="div" color="text.primary">
                {parseFloat(stats.monthlyRevenue).toFixed(2)} MAD
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h3" component="div" color="text.primary">
                {parseFloat(stats.totalRevenue).toFixed(2)} MAD
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payments Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 2 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Payment History
            </Typography>
          </Box>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Motor</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No Payments Found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          You haven't received any payments yet. Payments will appear here once you start receiving bookings.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {new Date(payment.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{payment.customerName}</TableCell>
                      <TableCell>{payment.motorName}</TableCell>
                      <TableCell>{parseFloat(payment.amount).toFixed(2)} MAD</TableCell>
                      <TableCell>
                        {payment.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : payment.paymentMethod}
                      </TableCell>
                      <TableCell>{getStatusChip(payment.status)}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          {payment.status === 'pending' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleValidate(payment.id)}
                            >
                              Validate
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleDelete(payment.id)}
                          >
                            Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={payments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default SellerPayments;
