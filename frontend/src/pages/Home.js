import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Button,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Navbar from '../components/Navbar';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [motors, setMotors] = useState([]);
  const [sellers, setSellers] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState({
    min: '',
    max: ''
  });

  useEffect(() => {
    fetchMotorsAndSellers();
  }, []);

  const fetchMotorsAndSellers = async () => {
    try {
      const endpoint = 'http://localhost:5000/api/motors/public';

      const response = await fetch(endpoint, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch motors');
      const data = await response.json();
      setMotors(data);

      // Always fetch seller info for all motors
      const uniqueSellerIds = [...new Set(data.map(motor => motor.sellerId))];
      const sellersData = {};
      
      await Promise.all(
        uniqueSellerIds.map(async (sellerId) => {
          try {
            const sellerResponse = await fetch(`http://localhost:5000/api/seller/profile/${sellerId}`, {
              credentials: 'include'
            });
            if (sellerResponse.ok) {
              const sellerData = await sellerResponse.json();
              sellersData[sellerId] = sellerData;
            }
          } catch (error) {
            console.error(`Error fetching seller ${sellerId}:`, error);
          }
        })
      );
      
      setSellers(sellersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMotors = motors.filter(motor => {
    const matchesSearch = motor.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = (!priceRange.min || motor.dailyRate >= Number(priceRange.min)) &&
                        (!priceRange.max || motor.dailyRate <= Number(priceRange.max));
    return matchesSearch && matchesPrice;
  });

  const handleMotorClick = (motorId) => {
    navigate('/motor/' + motorId);
  };

  const renderRoleBasedActions = () => {
    if (!user) return null;

    switch (user.role) {
      case 'seller':
        return (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/seller')}
            sx={{ mt: 2 }}
          >
            Manage My Motors
          </Button>
        );
      case 'admin':
        return (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/admin')}
            sx={{ mt: 2 }}
          >
            Admin Dashboard
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Navbar />

      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" gutterBottom>
            Find Your Perfect Ride
          </Typography>
          <Typography variant="h5" sx={{ mb: 4 }}>
            Rent or Buy Premium Motorcycles
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', maxWidth: 800, mx: 'auto' }}>
            <TextField
              fullWidth
              placeholder="Search by motorcycle name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
              sx={{
                bgcolor: 'white',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { border: 'none' }
                }
              }}
            />
            <TextField
              placeholder="Min price"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              // InputProps={{
              //   startAdornment: (
              //     <InputAdornment position="start">
              //       MAD
              //     </InputAdornment>
              //   )
              // }}
              sx={{
                width: 200,
                bgcolor: 'white',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { border: 'none' }
                }
              }}
            />
            <TextField
              placeholder="Max price"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              // InputProps={{
              //   startAdornment: (
              //     <InputAdornment position="start">
              //       MAD
              //     </InputAdornment>
              //   )
              // }}
              sx={{
                width: 200,
                bgcolor: 'white',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { border: 'none' }
                }
              }}
            />
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Grid container spacing={3}>
          {filteredMotors.map((motor) => (
            <Grid item xs={12} sm={6} md={4} key={motor.id}>
              <Card 
                sx={{ 
                  minHeight: 400,
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                    transition: 'all 0.3s ease'
                  },
                  position: 'relative'
                }}
                onClick={() => handleMotorClick(motor.id)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={motor.imageUrl ? 'http://localhost:5000' + motor.imageUrl : '/placeholder.jpg'}
                  alt={motor.title}
                  sx={{ 
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                />
                <CardContent sx={{ 
                  p: 2,
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography gutterBottom variant="h6" component="h2">
                      {motor.title}
                    </Typography>
                    {sellers[motor.sellerId] && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {sellers[motor.sellerId].profileImageUrl ? (
                          <Box
                            component="img"
                            src={'http://localhost:3000' + sellers[motor.sellerId].profileImageUrl}
                            alt={sellers[motor.sellerId].name}
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24,
                              bgcolor: 'grey.400',
                              fontSize: '14px'
                            }}
                          >
                            <PersonIcon sx={{ fontSize: '16px' }} />
                          </Avatar>
                        )}
                        <Chip
                          label={sellers[motor.sellerId].name}
                          size="small"
                          color="info"
                        />
                      </Box>
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '2.5em',
                      mb: 1
                    }}
                  >
                    {motor.description}
                  </Typography>
                  
                  <Box sx={{ mt: 'auto', pt: 2 }}>
                    {/* Price and Availability Information */}
                    <Stack spacing={1}>
                      <Stack 
                        direction="row" 
                        spacing={1} 
                        alignItems="center"
                        flexWrap="wrap"
                        sx={{ gap: 1 }}
                      >
                        {motor.price && (
                          <Chip
                            icon={<MoneyIcon />}
                            label={motor.price + ' MAD'}
                            size="small"
                            color="primary"
                          />
                        )}
                        {motor.dailyRate && (
                          <Chip
                            icon={<CalendarIcon />}
                            label={motor.dailyRate + ' MAD/day'}
                            size="small"
                            color="secondary"
                          />
                        )}
                        {motor.current_status === 'booked' ? (
                          <Chip
                            icon={<CalendarIcon />}
                            label={`Available ${new Date(motor.available_after).toLocaleDateString('en-GB', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}`}
                            size="small"
                            color="error"
                          />
                        ) : (
                          <Chip
                            label="Available Now"
                            size="small"
                            color="success"
                          />
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredMotors.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No motorcycles found
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Home;
