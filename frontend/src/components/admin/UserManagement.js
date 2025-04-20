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
  Button,
  IconButton,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import {
  Block as BlockIcon,
  CheckCircle as UnblockIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

const UserManagement = ({
  users,
  pagination,
  onPageChange,
  onSearch,
  onRoleFilter,
  onUpdateStatus,
  onUpdateRole
}) => {
  const [page, setPage] = useState(pagination.current ? pagination.current - 1 : 0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    setPage(pagination.current ? pagination.current - 1 : 0);
  }, [pagination.current]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    onPageChange(newPage + 1, rowsPerPage);
  };

  const handleRowsPerPageChange = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    onPageChange(1, newRowsPerPage);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    onSearch(event.target.value);
  };

  const handleRoleFilter = (event) => {
    setRoleFilter(event.target.value);
    onRoleFilter(event.target.value);
  };

  const handleStatusUpdate = (userId, currentStatus) => {
    onUpdateStatus(userId, !currentStatus);
  };

  const handleRoleUpdate = () => {
    if (editUser && newRole) {
      onUpdateRole(editUser.id, newRole);
      setEditUser(null);
      setNewRole('');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <TextField
          label="Search Users"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearch}
          sx={{ width: 200 }}
        />
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>Filter by Role</InputLabel>
          <Select
            value={roleFilter}
            onChange={handleRoleFilter}
            label="Filter by Role"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="seller">Seller</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={
                      user.role === 'admin' ? 'error' :
                      user.role === 'seller' ? 'warning' : 'primary'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isBlocked ? 'Blocked' : 'Active'}
                    color={user.isBlocked ? 'error' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleStatusUpdate(user.id, user.isBlocked)}
                    color={user.isBlocked ? "success" : "error"}
                    title={user.isBlocked ? "Unblock User" : "Block User"}
                  >
                    {user.isBlocked ? <UnblockIcon /> : <BlockIcon />}
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setEditUser(user);
                      setNewRole(user.role);
                    }}
                    color="primary"
                    title="Edit Role"
                  >
                    <EditIcon />
                  </IconButton>
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
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25]}
      />

      <Dialog open={!!editUser} onClose={() => setEditUser(null)}>
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Role</InputLabel>
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              label="New Role"
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="seller">Seller</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)}>Cancel</Button>
          <Button onClick={handleRoleUpdate} color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
