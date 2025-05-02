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
  Typography,
  Chip,
  Avatar
} from '@mui/material';
import axios from 'axios';

const ChatManagement = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchChats();
  }, [page, rowsPerPage]);

  const fetchChats = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/admin/chats?page=${page + 1}&limit=${rowsPerPage}`,
        { withCredentials: true }
      );
      setChats(data.chats);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Chat Management</Typography>
      
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Last Active</TableCell>
                <TableCell>Messages</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chats.map((chat) => (
                <TableRow key={chat.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={chat.profileImage} alt={chat.username} />
                      {chat.username}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={chat.role}
                      color={chat.role === 'seller' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(chat.lastActive).toLocaleString()}
                  </TableCell>
                  <TableCell>{chat.messageCount}</TableCell>
                  <TableCell>
                    <Chip 
                      label={chat.isOnline ? 'Online' : 'Offline'}
                      color={chat.isOnline ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>
    </Box>
  );
};

export default ChatManagement;
