import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Button,
  Chip,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    subscriptionId: null,
    subscriptionDetails: null
  });

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(0); // Reset to first page when searching
    if (!query) {
      setFilteredSubscriptions(subscriptions);
      return;
    }
    const lowercaseQuery = query.toLowerCase();
    const filtered = subscriptions.filter(subscription => 
      subscription.seller_name.toLowerCase().includes(lowercaseQuery) ||
      subscription.seller_email?.toLowerCase().includes(lowercaseQuery)
    );
    setFilteredSubscriptions(filtered);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/subscriptions', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data);
      setFilteredSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleApprove = async (subscriptionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/subscriptions/${subscriptionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to approve subscription');
      }

      fetchSubscriptions();
    } catch (error) {
      console.error('Error approving subscription:', error);
    }
  };

  const handleReject = async (subscriptionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/subscriptions/${subscriptionId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to reject subscription');
      }

      fetchSubscriptions();
    } catch (error) {
      console.error('Error rejecting subscription:', error);
    }
  };

  const handleDeleteClick = (subscription) => {
    setDeleteDialog({
      open: true,
      subscriptionId: subscription.id,
      subscriptionDetails: subscription
    });
  };

  const handleDeleteClose = () => {
    setDeleteDialog({
      open: false,
      subscriptionId: null,
      subscriptionDetails: null
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/subscriptions/${deleteDialog.subscriptionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete subscription');
      }

      handleDeleteClose();
      fetchSubscriptions();
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, maxWidth: '100%' }}>
        <Typography variant="h5">Subscription Management</Typography>
        <TextField
          placeholder="Search by name or email"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          autoComplete="off"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
      </Box>
      <TableContainer component={Paper} sx={{ maxWidth: '100%' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Seller</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requested</TableCell>
              <TableCell>Trial Used</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Subscriptions Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery ? 
                      "No subscriptions match your search criteria. Try a different search term." :
                      "No subscription requests have been made yet."}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>{subscription.seller_name}</TableCell>
                  <TableCell>{subscription.display_plan_name}</TableCell>
                  <TableCell>{subscription.price} MAD</TableCell>
                  <TableCell>
                    {subscription.is_trial ? '7 days' :
                     subscription.duration_months ? `${subscription.duration_months} months` :
                     'Unlimited'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={subscription.status}
                      color={
                        subscription.status === 'active' ? 'success' :
                        subscription.status === 'pending' ? 'warning' :
                        subscription.status === 'rejected' ? 'error' :
                        'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(subscription.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={subscription.has_used_trial > 0 ? "Yes" : "No"}
                      color={subscription.has_used_trial > 0 ? "warning" : "success"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {subscription.status === 'pending' && (
                        <>
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => handleApprove(subscription.id)}
                          >
                            <CheckIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleReject(subscription.id)}
                          >
                            <CloseIcon />
                          </IconButton>
                        </>
                      )}
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeleteClick(subscription)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filteredSubscriptions.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteClose}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Subscription
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this subscription?
            {deleteDialog.subscriptionDetails && (
              <Box sx={{ mt: 2, backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                  <strong>Seller:</strong> {deleteDialog.subscriptionDetails.seller_name}
                </Typography>
                <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                  <strong>Plan:</strong> {deleteDialog.subscriptionDetails.display_plan_name}
                </Typography>
                <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                  <strong>Price:</strong> {deleteDialog.subscriptionDetails.price} MAD
                </Typography>
                <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                  <strong>Duration:</strong> {
                    deleteDialog.subscriptionDetails.is_trial ? '7 days' :
                    deleteDialog.subscriptionDetails.duration_months ? 
                    `${deleteDialog.subscriptionDetails.duration_months} months` :
                    'Unlimited'
                  }
                </Typography>
                <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                  <strong>Max Listings:</strong> Up to {deleteDialog.subscriptionDetails.max_listings} listings
                </Typography>
                <Typography variant="body2" component="div">
                  <strong>Status:</strong> {deleteDialog.subscriptionDetails.status}
                </Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionManagement;
