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
  TablePagination,
  Chip,
  Typography,
  Stack,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/seller/orders', {
        withCredentials: true
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAccept = async (orderId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/bookings/${orderId}/status`,
        { status: 'confirmed' },
        { withCredentials: true }
      );
      setSuccess('Booking accepted successfully');
      fetchOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to accept booking');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCancel = async (orderId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/bookings/${orderId}/status`,
        { status: 'cancelled' },
        { withCredentials: true }
      );
      setSuccess('Booking cancelled successfully');
      fetchOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to cancel booking');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/bookings/${orderId}/status`,
        { 
          status: newStatus,
          validatePayment: newStatus === 'completed'
        },
        { withCredentials: true }
      );

      setSuccess(`Order status updated to ${newStatus}`);
      fetchOrders();
      setStatusDialogOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update order status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (orderId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/bookings/${orderId}`,
        { withCredentials: true }
      );
      setSuccess('Order deleted successfully');
      fetchOrders();
      setDeleteDialogOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to delete order');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const renderActions = (order) => {
    if (order.status === 'pending') {
      return (
        <ButtonGroup size="small">
          <Button
            variant="contained"
            color="success"
            onClick={() => handleAccept(order.id)}
            startIcon={<CheckIcon />}
          >
            Accept
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleCancel(order.id)}
            startIcon={<CloseIcon />}
          >
            Cancel
          </Button>
        </ButtonGroup>
      );
    }

    return (
      <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={() => {
              setSelectedOrder(order);
              setStatusDialogOpen(true);
            }}
            sx={{ whiteSpace: 'nowrap' }}
          >
            CHANGE STATUS
          </Button>
        <Button
          variant="outlined"
          size="small"
          color="error"
          onClick={() => {
            setSelectedOrder(order);
            setDeleteDialogOpen(true);
          }}
        >
          DELETE
        </Button>
      </Stack>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h5" component="h2">
          Orders
        </Typography>
      </Stack>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Motor</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>{new Date(order.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label="RENTAL"
                        color="primary"
                        size="small"
                        sx={{ minWidth: 85 }}
                      />
                    </TableCell>
                    <TableCell>{order.motorName}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{(Number(order.totalPrice) || 0).toLocaleString()} MAD</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status.toUpperCase()}
                        color={getStatusColor(order.status)}
                        size="small"
                        sx={{ minWidth: 85 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.paymentMethod === 'cash_on_delivery' ? 'CASH ON DELIVERY' : 'IN-STORE'}
                        color={order.paymentMethod === 'cash_on_delivery' ? 'warning' : 'info'}
                        size="small"
                        sx={{ minWidth: 85 }}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      {renderActions(order)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={orders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}

      {/* Status Change Dialog */}
      <Dialog 
        open={statusDialogOpen} 
        onClose={() => setStatusDialogOpen(false)}
        PaperProps={{
          sx: {
            width: '400px',
            maxWidth: '90%',
            borderRadius: '8px'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #e0e0e0',
          pb: 2
        }}>
          Change Order Status
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Current Status: {selectedOrder.status.toUpperCase()}
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>New Status</InputLabel>
                <Select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                  label="New Status"
                >
                  <MenuItem value="confirmed">CONFIRM ORDER</MenuItem>
                  <MenuItem value="completed">MARK AS COMPLETED</MenuItem>
                  <MenuItem value="pending">SET AS PENDING</MenuItem>
                  <MenuItem value="cancelled">CANCEL ORDER</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: '1px solid #e0e0e0',
          justifyContent: 'flex-end',
          p: 2
        }}>
          <Button 
            onClick={() => setStatusDialogOpen(false)}
            sx={{ 
              color: '#2196f3',
              '&:hover': {
                backgroundColor: 'transparent',
                textDecoration: 'underline'
              }
            }}
          >
            CLOSE
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Order</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this order?</Typography>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Order ID:</strong> #{selectedOrder.id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Customer:</strong> {selectedOrder.customerName}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Motor:</strong> {selectedOrder.motorName}
              </Typography>
              <Typography variant="body2">
                <strong>Amount:</strong> {(Number(selectedOrder.totalPrice) || 0).toLocaleString()} MAD
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            color="error" 
            onClick={() => handleDelete(selectedOrder.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellerOrders;
