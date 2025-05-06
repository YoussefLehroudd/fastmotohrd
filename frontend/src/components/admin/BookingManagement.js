import React, { useState } from 'react';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
import {
  Info as InfoIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';

const statusColors = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'error',
  paid: 'success',
  unpaid: 'error'
};

const paymentStatusColors = {
  pending: 'warning',
  validated: 'success',
  rejected: 'error'
};

const BookingManagement = ({ bookings, pagination, onPageChange, onSearch, onStatusFilter }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);

  const handleRowsPerPageChange = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    onPageChange(1, newRowsPerPage);
  };


  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    onPageChange(newPage + 1, rowsPerPage);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    onSearch(event.target.value);
  };

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);
    onStatusFilter(event.target.value);
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setDetailsDialog(true);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <TextField
          label="Search Bookings"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearch}
          sx={{ width: 200 }}
          placeholder="Search by motor, user..."
        />
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={handleStatusFilter}
            label="Filter by Status"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Booking ID</TableCell>
              <TableCell>Motor</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Seller</TableCell>
              <TableCell>Dates</TableCell>
              <TableCell>Total Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Bookings Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    No motorcycle bookings have been made yet. Bookings will appear here once customers start renting motorcycles.
                  </Typography>
                  {statusFilter && (
                    <Typography variant="body2" color="text.secondary">
                      Try removing the status filter to see all bookings.
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.id}</TableCell>
                  <TableCell>{booking.motorTitle}</TableCell>
                  <TableCell>{booking.userName}</TableCell>
                  <TableCell>{booking.sellerName}</TableCell>
                  <TableCell>
                    {`${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}`}
                  </TableCell>
                  <TableCell>{booking.totalPrice} MAD</TableCell>
                  <TableCell>
                    <Chip
                      label={booking.status}
                      color={statusColors[booking.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={booking.paymentStatus || 'unpaid'}
                      color={paymentStatusColors[booking.paymentStatus] || 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(booking)}
                      >
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                    {booking.status === 'pending' && (
                      <Tooltip title="View Payment">
                        <IconButton
                          size="small"
                          color="primary"
                        >
                          <PaymentIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={pagination.total || 0}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      {/* Booking Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Booking Details
          <Typography variant="subtitle2" color="text.secondary">
            ID: {selectedBooking?.id}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedBooking && (
            <Box sx={{ '& > *': { mb: 2 } }}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">Motor Details</Typography>
                <Typography>
                  {selectedBooking.motorTitle}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold">Booking Period</Typography>
                <Typography>
                  Start: {new Date(selectedBooking.startDate).toLocaleDateString()}
                  <br />
                  End: {new Date(selectedBooking.endDate).toLocaleDateString()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold">Location</Typography>
                <Typography>
                  {selectedBooking.city}, {selectedBooking.address}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold">Payment Details</Typography>
                <Typography>
                  Total Amount: {selectedBooking.totalPrice} MAD
                  <br />
                  Payment Status: <Chip 
                    label={selectedBooking.paymentStatus || 'unpaid'} 
                    size="small"
                    color={paymentStatusColors[selectedBooking.paymentStatus] || 'error'}
                  />
                  {selectedBooking.paymentDate && (
                    <>
                      <br />
                      Payment Date: {new Date(selectedBooking.paymentDate).toLocaleString()}
                    </>
                  )}
                  {selectedBooking.paymentMethod && (
                    <>
                      <br />
                      Payment Method: {selectedBooking.paymentMethod}
                    </>
                  )}
                </Typography>
              </Box>

              {selectedBooking.specialRequests && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">Special Requests</Typography>
                  <Typography>{selectedBooking.specialRequests}</Typography>
                </Box>
              )}

              {selectedBooking.cancellationReason && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">Cancellation Reason</Typography>
                  <Typography color="error">{selectedBooking.cancellationReason}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingManagement;
