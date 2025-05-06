import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import axios from 'axios';

const MotorLocations = ({ motorId }) => {
  const [locations, setLocations] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [formData, setFormData] = useState({
    city: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertProgress, setAlertProgress] = useState(100);

  const fetchLocations = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/motors/${motorId}/locations`, {
        withCredentials: true
      });
      setLocations(response.data);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load locations');
    }
  }, [motorId, setError]);

  useEffect(() => {
    if (motorId) {
      fetchLocations();
    }
  }, [motorId, fetchLocations]);

  useEffect(() => {
    let progressTimer;

    if (error || success) {
      setShowAlert(true);
      setAlertProgress(100);
      
      const startTime = Date.now();
      const duration = 4000;

      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 1 - elapsed / duration);
        
        setAlertProgress(remaining * 100);
        
        if (remaining > 0) {
          progressTimer = requestAnimationFrame(updateProgress);
        } else {
          setShowAlert(false);
          setError('');
          setSuccess('');
        }
      };
      
      progressTimer = requestAnimationFrame(updateProgress);
    }
    
    return () => {
      if (progressTimer) cancelAnimationFrame(progressTimer);
    };
  }, [error, success]);

  const handleOpen = (location = null) => {
    if (location) {
      setEditMode(true);
      setCurrentLocation(location);
      setFormData({
        city: location.city,
        address: location.address
      });
    } else {
      setEditMode(false);
      setCurrentLocation(null);
      setFormData({
        city: '',
        address: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      city: '',
      address: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editMode && currentLocation) {
        await axios.patch(
          `http://localhost:5000/api/motors/${motorId}/locations/${currentLocation.id}`,
          formData,
          { withCredentials: true }
        );
        setSuccess('Location updated successfully!');
      } else {
        await axios.post(
          `http://localhost:5000/api/motors/${motorId}/locations`,
          formData,
          { withCredentials: true }
        );
        setSuccess('Location added successfully!');
      }
      fetchLocations();
      handleClose();
    } catch (err) {
      console.error('Error saving location:', err);
      setError(err.response?.data?.message || 'Failed to save location');
    }
  };

  const handleDeleteClick = (location) => {
    setLocationToDelete(location);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (locationToDelete) {
        await axios.delete(
          `http://localhost:5000/api/motors/${motorId}/locations/${locationToDelete.id}`,
          { withCredentials: true }
        );
        setSuccess('Location deleted successfully!');
        fetchLocations();
        setDeleteDialogOpen(false);
        setLocationToDelete(null);
      }
    } catch (err) {
      console.error('Error deleting location:', err);
      setError(err.response?.data?.message || 'Failed to delete location');
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Locations
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Location
          </Button>
        </Box>

        {showAlert && (
          <Alert 
            severity={error ? "error" : "success"}
            sx={{
              position: 'fixed',
              top: 64,
              right: 16,
              zIndex: 1200,
              minWidth: 200,
              maxWidth: 400,
              boxShadow: 3,
              transition: 'all 0.3s ease',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: `${alertProgress}%`,
                height: '2px',
                backgroundColor: error ? '#d32f2f' : '#2e7d32',
                transition: 'width 0.3s ease-out'
              }
            }}
          >
            {error || success}
          </Alert>
        )}

        <List>
          {locations.map((location) => (
            <ListItem
              key={location.id}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                mb: 1,
                '&:last-child': { mb: 0 }
              }}
              secondaryAction={
                <Box>
                  <IconButton 
                    edge="end" 
                    aria-label="edit"
                    onClick={() => handleOpen(location)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => handleDeleteClick(location)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <LocationIcon sx={{ mr: 2, color: 'primary.main' }} />
              <ListItemText
                primary={location.city}
                secondary={location.address}
              />
            </ListItem>
          ))}
          {locations.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Locations Added Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add locations where this motorcycle is available for rent. Click the "Add Location" button above to get started.
              </Typography>
            </Box>
          )}
        </List>
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Location' : 'Add New Location'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="City"
              fullWidth
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Address"
              fullWidth
              multiline
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editMode ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Location</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this location?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MotorLocations;
