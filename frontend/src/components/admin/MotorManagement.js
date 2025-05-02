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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Chip
} from '@mui/material';

const statusColors = {
  true: 'success',  // isAvailableForRent: true
  false: 'warning'  // isAvailableForRent: false
};

const getStatusLabel = (isAvailableForRent) => 
  isAvailableForRent ? 'Available' : 'Rented';

const MotorManagement = ({ motors, pagination, onPageChange, onSearch, onStatusFilter, onTypeFilter }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleTypeFilter = (event) => {
    setTypeFilter(event.target.value);
    onTypeFilter(event.target.value);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <TextField
          label="Search Motors"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearch}
          sx={{ width: 200 }}
          placeholder="Search by title, brand..."
        />
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={handleStatusFilter}
            label="Filter by Status"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="available">Available</MenuItem>
            <MenuItem value="rented">Rented</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>Filter by Type</InputLabel>
          <Select
            value={typeFilter}
            onChange={handleTypeFilter}
            label="Filter by Type"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="sport">Sport</MenuItem>
            <MenuItem value="cruiser">Cruiser</MenuItem>
            <MenuItem value="touring">Touring</MenuItem>
            <MenuItem value="dirt">Dirt</MenuItem>
            <MenuItem value="scooter">Scooter</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Brand/Model</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Daily Rate</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Seller</TableCell>
              <TableCell>Location</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {motors.map((motor) => (
              <TableRow key={motor.id}>
                <TableCell>
                  <Avatar
                    src={motor.imageUrl}
                    alt={motor.title}
                    variant="rounded"
                    sx={{ width: 60, height: 60 }}
                  />
                </TableCell>
                <TableCell>{motor.title}</TableCell>
                <TableCell>{`${motor.brand} ${motor.model} (${motor.year})`}</TableCell>
                <TableCell>
                  <Chip 
                    label={motor.motorType}
                    size="small"
                    color="primary"
                  />
                </TableCell>
                <TableCell>{motor.dailyRate} MAD/day</TableCell>
                <TableCell>
                  <Chip 
                    label={getStatusLabel(motor.isAvailableForRent)}
                    color={statusColors[motor.isAvailableForRent]}
                    size="small"
                  />
                </TableCell>
                <TableCell>{motor.sellerName}</TableCell>
                <TableCell>
                  <Chip 
                    label={motor.city || 'N/A'}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                    title={motor.address || ''}
                  />
                </TableCell>
              </TableRow>
            ))}
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
    </Box>
  );
};

export default MotorManagement;
