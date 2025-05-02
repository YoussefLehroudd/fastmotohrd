import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Typography,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Chip,
  Fab,
  MenuItem,
  Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  CloudUpload as CloudUploadIcon,
  Add as AddIcon
} from '@mui/icons-material';
import SellerNavbar from '../components/SellerNavbar';
import MotorLocations from '../components/MotorLocations';
import SellerDashboard from '../components/SellerDashboard';
import SellerOrders from '../components/SellerOrders';
import SellerPayments from '../components/SellerPayments';
import SellerReviews from '../components/SellerReviews';

const Seller = () => {
  const [motors, setMotors] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentMotor, setCurrentMotor] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedMotorId, setSelectedMotorId] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState({ show: false, message: '' });
  const [success, setSuccess] = useState({ show: false, message: '' });

  useEffect(() => {
    fetchMotors();
    // Check for initial tab selection
    const savedTab = localStorage.getItem('selectedTab');
    if (savedTab !== null) {
      setSelectedTab(parseInt(savedTab));
      localStorage.removeItem('selectedTab'); // Clear after using
    }
  }, []);

  const fetchMotors = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/motors/seller', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch motors');
      }
      const data = await response.json();
      setMotors(data);
    } catch (error) {
      console.error('Error fetching motors:', error);
    setError({ show: true, message: 'Failed to load motors' });
    }
  };

  const handleOpen = (motor = null) => {
    if (motor) {
      setEditMode(true);
      setCurrentMotor(motor);
      setFormData({
        title: motor.title,
        description: motor.description,
        brand: motor.brand || '',
        model: motor.model || '',
        year: motor.year || '',
        capacity: motor.capacity || '',
        seats: motor.seats || '',
        price: motor.price,
        imageUrl: motor.imageUrl,
        dailyRate: motor.dailyRate,
        isSaleActive: motor.price !== null,
        isRentalActive: motor.dailyRate !== null,
        isActive: Boolean(motor.isActive),
        isAvailableForRent: Boolean(motor.isAvailableForRent),
        imageFile: null,
        motorType: motor.motorType || 'other'
      });
    } else {
      setEditMode(false);
      setCurrentMotor(null);
      setFormData({
        title: '',
        description: '',
        brand: '',
        model: '',
        year: '',
        capacity: '',
        seats: '',
        price: '',
        imageUrl: '',
        dailyRate: '',
        isSaleActive: false,
        isRentalActive: false,
        isActive: true,
        isAvailableForRent: true,
        imageFile: null,
        motorType: 'other'
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError({ show: false, message: '' });
    setSuccess({ show: false, message: '' });
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    
    
    if (name === 'isSaleActive' || name === 'isRentalActive') {
      if (!checked) {
        setFormData({
          ...formData,
          [name]: checked,
          [name === 'isSaleActive' ? 'price' : 'dailyRate']: ''
        });
      } else {
        setFormData({
          ...formData,
          [name]: checked
        });
      }
    } else {
      // Prevent negative numbers for numeric fields
      if (type === 'number' && parseFloat(value) < 0) {
        return;
      }
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editMode 
        ? `http://localhost:5000/api/motors/${currentMotor.id}`
        : 'http://localhost:5000/api/motors';

      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'imageFile' && formData[key]) {
          formDataToSend.append('image', formData[key]);
        } else if (key !== 'imageFile' && key !== 'imageUrl') {
          // Convert empty strings to null for optional fields
          const value = ['brand', 'model', 'year', 'capacity', 'seats'].includes(key) && formData[key] === '' 
            ? null 
            : formData[key];
          formDataToSend.append(key, value);
        }
      });

      formDataToSend.append('price', formData.isSaleActive && formData.price ? String(formData.price) : '');
      formDataToSend.append('dailyRate', formData.isRentalActive && formData.dailyRate ? String(formData.dailyRate) : '');

      const response = await fetch(url, {
        method: editMode ? 'PATCH' : 'POST',
        credentials: 'include',
        body: formDataToSend
      });

      if (!response.ok) {
        throw new Error('Failed to save motor');
      }

      setSuccess({
        show: true,
        message: editMode ? 'Motor updated successfully!' : 'Motor added successfully!'
      });
      fetchMotors();
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving motor:', error);
    setError({ show: true, message: 'Failed to save motor' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this motor?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/motors/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to delete motor');
        }

        setSuccess({
          show: true,
          message: 'Motor deleted successfully!'
        });
        fetchMotors();
      } catch (error) {
        console.error('Error deleting motor:', error);
    setError({ show: true, message: 'Failed to delete motor' });
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    if (typeof newValue === 'number') {
      setSelectedTab(newValue);
      // Only store tab in localStorage if it's not the location tab (5)
      if (newValue !== 5) {
        localStorage.setItem('selectedTab', newValue.toString());
      }
    }
  };

  const handleMotorSelect = (motorId) => {
    setSelectedMotorId(motorId);
    setSelectedTab(5); // Switch to locations tab
  };

  return (
    <>
      <SellerNavbar selectedTab={selectedTab} onTabChange={handleTabChange} />
      <Container>
        <Box sx={{ mt: 4, mb: 4 }}>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Dashboard" />
            <Tab label="Orders" />
            <Tab label="Payments" />
            <Tab label="Reviews" />
            <Tab label="My Motors" />
            <Tab label="Add Location" disabled={!selectedMotorId} />
          </Tabs>

          <Snackbar
            open={error.show}
            autoHideDuration={4000}
            onClose={() => setError({ show: false, message: '' })}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setError({ show: false, message: '' })}
              severity="error"
              variant="filled"
              sx={{ width: '100%' }}
            >
              {error.message}
            </Alert>
          </Snackbar>

          <Snackbar
            open={success.show}
            autoHideDuration={2000}
            onClose={() => setSuccess({ show: false, message: '' })}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setSuccess({ show: false, message: '' })}
              severity="success"
              variant="filled"
              sx={{ width: '100%' }}
            >
              {success.message}
            </Alert>
          </Snackbar>

          {selectedTab === 0 && <SellerDashboard />}
          {selectedTab === 1 && <SellerOrders />}
          {selectedTab === 2 && <SellerPayments />}
          {selectedTab === 3 && <SellerReviews />}
          {selectedTab === 4 && (
            <>
              <Grid container spacing={3}>
                {motors.map((motor) => (
                  <Grid item xs={12} sm={6} md={4} key={motor.id}>
                    <Card>
                      {motor.imageUrl && (
                        <Box sx={{ pt: '60%', position: 'relative', overflow: 'hidden' }}>
                          <img 
                            src={`http://localhost:5000${motor.imageUrl}`}
                            alt={motor.title}
                            style={{
                              position: 'absolute',
                              top: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </Box>
                      )}
                      <CardContent sx={{ 
                        pb: 1, 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        minHeight: '180px' // Further reduced minimum height
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          mb: 1,
                          minHeight: '64px' // Set minimum height for title area
                        }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {motor.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {[
                                [motor.brand, motor.model, motor.year].filter(Boolean).join(' '),
                                motor.capacity && `${motor.capacity}cc`,
                                motor.seats && `${motor.seats} seats`
                              ].filter(Boolean).join(' • ')}
                            </Typography>
                          </Box>
                          <Chip
                            label={motor.isActive ? "Available" : "Not Available"}
                            size="small"
                            color={motor.isActive ? "success" : "default"}
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </Box>
                        <Stack direction="row" spacing={1} mb={2}>
                          {motor.price && (
                            <Chip
                              icon={<MoneyIcon />}
                              label={`${motor.price} MAD`}
                              size="small"
                              color="primary"
                            />
                          )}
                          {motor.dailyRate && (
                            <Chip
                              icon={<CalendarIcon />}
                              label={`${motor.dailyRate} MAD/day`}
                              size="small"
                              color="secondary"
                            />
                          )}
                        </Stack>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              minHeight: '40px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              mb: 1,
                              flex: 1
                            }}
                          >
                            {motor.description}
                          </Typography>

                      </CardContent>
                      <Divider />
                      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<CalendarIcon />}
                            onClick={() => handleMotorSelect(motor.id)}
                          >
                            Add Location
                          </Button>
                        </Box>
                        <Box>
                          <IconButton 
                            onClick={() => handleOpen(motor)}
                            color="primary"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            onClick={() => handleDelete(motor.id)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Stack 
                sx={{ 
                  position: 'fixed', 
                  bottom: 90, 
                  right: 16, 
                  zIndex: 999,
                  flexDirection: 'row'
                }}
                spacing={2}
              >
                <Fab 
                  color="primary" 
                  onClick={() => handleOpen()}
                  aria-label="add motor"
                >
                  <AddIcon />
                </Fab>
                {selectedMotorId && (
                  <Fab 
                    color="secondary" 
                    onClick={() => setSelectedTab(5)}
                    aria-label="add location"
                  >
                    <CalendarIcon />
                  </Fab>
                )}
              </Stack>
            </>
          )}
          {selectedTab === 5 && selectedMotorId && (
            <MotorLocations motorId={selectedMotorId} />
          )}
        </Box>

        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>{editMode ? 'Edit Motor' : 'Add New Motor'}</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    name="title"
                    label="Title"
                    fullWidth
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="brand"
                    label="Brand"
                    fullWidth
                    value={formData.brand || ''}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="model"
                    label="Model"
                    fullWidth
                    value={formData.model || ''}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="year"
                    label="Year"
                    type="number"
                    fullWidth
                    value={formData.year || ''}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    name="motorType"
                    label="Motorcycle Type"
                    fullWidth
                    value={formData.motorType || 'other'}
                    onChange={handleChange}
                    required
                  >
                    <MenuItem value="sport">Sport</MenuItem>
                    <MenuItem value="cruiser">Cruiser</MenuItem>
                    <MenuItem value="touring">Touring</MenuItem>
                    <MenuItem value="dirt">Dirt</MenuItem>
                    <MenuItem value="scooter">Scooter</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="capacity"
                    label="Capacity (cc)"
                    type="number"
                    fullWidth
                    value={formData.capacity || ''}
                    inputProps={{ min: 0 }}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="seats"
                    label="Number of Seats"
                    type="number"
                    fullWidth
                    value={formData.seats || ''}
                    inputProps={{ min: 0 }}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="description"
                    label="Description"
                    fullWidth
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            name="isSaleActive"
                            checked={Boolean(formData.isSaleActive)}
                            onChange={handleChange}
                            color="primary"
                          />
                        }
                        label="Enable Sale Price"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            name="isRentalActive"
                            checked={Boolean(formData.isRentalActive)}
                            onChange={handleChange}
                            color="primary"
                          />
                        }
                        label="Enable Daily Rental"
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {(formData.isSaleActive || formData.isRentalActive) && (
                  <>
                    {formData.isSaleActive && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="price"
                          label="Sale Price"
                          type="number"
                          fullWidth
                          value={formData.price}
                          onChange={handleChange}
                          required={formData.isSaleActive}
                          inputProps={{ min: 0 }}
                          InputProps={{
                            endAdornment: 'MAD'
                          }}
                        />
                      </Grid>
                    )}
                    {formData.isRentalActive && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="dailyRate"
                          label="Daily Rental Rate"
                          type="number"
                          fullWidth
                          value={formData.dailyRate}
                          onChange={handleChange}
                          required={formData.isRentalActive}
                          inputProps={{ min: 0 }}
                          InputProps={{
                            endAdornment: 'MAD'
                          }}
                        />
                      </Grid>
                    )}
                  </>
                )}

                <Grid item xs={12}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="image-file"
                    type="file"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        const file = e.target.files[0];
                        if (file.size > 5 * 1024 * 1024) {
                          setError({ show: true, message: 'Image size must be less than 5MB' });
                          return;
                        }
                        const previewUrl = URL.createObjectURL(file);
                        setFormData({
                          ...formData,
                          imageFile: file,
                          imageUrl: previewUrl
                        });
                      }
                    }}
                  />
                  <label htmlFor="image-file">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<CloudUploadIcon />}
                    >
                      Upload Image
                    </Button>
                  </label>
                  {(formData.imageUrl || formData.imageFile) && (
                    <Box mt={2} textAlign="center">
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Preview:
                      </Typography>
                      <img 
                        src={formData.imageUrl}
                        alt="Preview"
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '200px',
                          objectFit: 'contain',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          padding: '4px'
                        }}
                      />
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="isActive"
                        checked={Boolean(formData.isActive)}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="Available for Rent"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                {editMode ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </>
  );
};

export default Seller;
