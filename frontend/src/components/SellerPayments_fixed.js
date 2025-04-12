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
  Button
} from '@mui/material';
import axios from 'axios';

const SellerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    pending_count: 0,
    validated_count: 0,
    total_validated: 0,
    total_pending: 0
  });

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

  const handleReject = async (paymentId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/payments/${paymentId}/reject`,
        {},
        { withCredentials: true }
      );
      fetchPayments();
    } catch (error) {
      console.error('Error rejecting payment:', error);
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
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Pending Payments
              </Typography>
              <Typography variant="h3" component="div" sx={{ mb: 1 }}>
                {stats.pending_count}
              </Typography>
              <Typography variant="h5" color="textSecondary">
                ${parseFloat(stats.total_pending).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Validated Payments
              </Typography>
              <Typography variant="h3" component="div" sx={{ mb: 1 }}>
                {stats.validated_count}
              </Typography>
              <Typography variant="h5" color="textSecondary">
                ${parseFloat(stats.total_validated).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payments Table */}
      <TableContainer component={Paper}>
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
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  {new Date(payment.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>{payment.customerName}</TableCell>
                <TableCell>{payment.motorName}</TableCell>
                <TableCell>${parseFloat(payment.amount).toFixed(2)}</TableCell>
                <TableCell>
                  {payment.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : payment.paymentMethod}
                </TableCell>
                <TableCell>{getStatusChip(payment.status)}</TableCell>
                <TableCell align="right">
                  {payment.status === 'pending' && (
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleValidate(payment.id)}
                      >
                        Validate
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleReject(payment.id)}
                      >
                        Reject
                      </Button>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SellerPayments;
