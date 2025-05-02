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
  Avatar,
  List,
  ListItem,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Divider,
  Paper,
  Radio,
  RadioGroup
} from '@mui/material';
import {
  Search as SearchIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
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
  const [brandCounts, setBrandCounts] = useState({});
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showBrandsSection, setShowBrandsSection] = useState(true);
  const [showPriceSection, setShowPriceSection] = useState(true);
  const [showAvailabilitySection, setShowAvailabilitySection] = useState(true);
  const [priceRange, setPriceRange] = useState({
    min: '',
    max: ''
  });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all', 'now', or 'later'

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
      
      // Calculate brand counts
      const counts = data.reduce((acc, motor) => {
        acc[motor.brand] = (acc[motor.brand] || 0) + 1;
        return acc;
      }, {});
      setBrandCounts(counts);

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

  const getAvailableCounts = () => {
    const availableNowCount = filteredMotors.filter(motor => motor.current_status === 'available').length;
    const availableLaterCount = filteredMotors.filter(motor => motor.current_status === 'booked').length;
    return { availableNowCount, availableLaterCount };
  };

  const filteredMotors = motors.filter(motor => {
    const matchesSearch = motor.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = (!priceRange.min || motor.dailyRate >= Number(priceRange.min)) &&
                        (!priceRange.max || motor.dailyRate <= Number(priceRange.max));
    const matchesBrand = selectedCategories.length === 0 || selectedCategories.includes(motor.brand);
    const matchesAvailability = 
      availabilityFilter === 'all' ||
      (availabilityFilter === 'now' && motor.current_status === 'available') ||
      (availabilityFilter === 'later' && motor.current_status === 'booked');
    
    return matchesSearch && matchesPrice && matchesBrand && matchesAvailability;
  });

  const handleMotorClick = (motorId) => {
    navigate('/motor/' + motorId);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Navbar />

      {/* Hero Section */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8, mb: 6, textAlign: 'center' }}>
        <Container maxWidth="lg" sx={{ pl: 2 }}>
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
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mb: 6, pl: 2 }}>
        <Grid container spacing={3}>
          {/* Filter Sidebar */}
          <Grid item xs={12} md={2.5}>
            <Paper sx={{ p: 1.5, borderRadius: 1 }}>
              {/* Brands Section */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  mb: 1.5
                }}
                onClick={() => setShowBrandsSection(!showBrandsSection)}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Brands ({Object.keys(brandCounts).length})
                </Typography>
                {showBrandsSection ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
              {showBrandsSection && (
                <>
                  <List>
                    {Object.entries(brandCounts)
                      .slice(0, showAllBrands ? undefined : 4)
                      .map(([brand, count]) => (
                      <ListItem key={brand} dense sx={{ pl: 0 }}>
                        <FormControlLabel
                          control={
                            <Checkbox 
                              checked={selectedCategories.includes(brand)}
                              onChange={() => setSelectedCategories(prev => 
                                prev.includes(brand)
                                  ? prev.filter(b => b !== brand)
                                  : [...prev, brand]
                              )}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <Typography>{brand} ({count})</Typography>
                            </Box>
                          }
                          sx={{ width: '100%' }}
                        />
                      </ListItem>
                    ))}
                    {Object.keys(brandCounts).length > 4 && (
                      <ListItem dense sx={{ pl: 0, justifyContent: 'center' }}>
                        <Button
                          onClick={() => setShowAllBrands(!showAllBrands)}
                          sx={{ 
                            textTransform: 'none',
                            color: 'primary.main',
                            '&:hover': {
                              background: 'none',
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {showAllBrands ? 'MASQUER' : `AFFICHER TOUS (${Object.keys(brandCounts).length - 4})`}
                        </Button>
                      </ListItem>
                    )}
                  </List>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {/* Price Section */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  mb: 1.5
                }}
                onClick={() => setShowPriceSection(!showPriceSection)}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Price (MAD)
                </Typography>
                {showPriceSection ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
              {showPriceSection && (
                <>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      placeholder="Min"
                      size="small"
                      fullWidth
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    />
                    <Typography sx={{ mx: 1 }}>-</Typography>
                    <TextField
                      placeholder="Max"
                      size="small"
                      fullWidth
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    />
                  </Box>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {/* Availability Section */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  mb: 1.5
                }}
                onClick={() => setShowAvailabilitySection(!showAvailabilitySection)}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Availability 
                </Typography>
                {showAvailabilitySection ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
              {showAvailabilitySection && (
                <RadioGroup
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                >
                  <FormControlLabel
                    value="now"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography>Available Now</Typography>
                        <Typography color="text.secondary">
                          ({motors.filter(m => m.current_status === 'available').length})
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="later"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography>Available Later</Typography>
                        <Typography color="text.secondary">
                          ({motors.filter(m => m.current_status === 'booked').length})
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              )}
            </Paper>
          </Grid>

          {/* Motorcycle Cards */}
          <Grid item xs={12} md={9.5}>
            <Grid container spacing={2}>
              {filteredMotors.map((motor) => (
                <Grid item xs={12} sm={6} md={5} key={motor.id}>
                  <Card 
                    sx={{ 
                      minHeight: 200,
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
                        <Stack spacing={1}>
                          <Stack 
                            direction="row" 
                            spacing={1} 
                            alignItems="center"
                            sx={{ 
                              flexWrap: "wrap",
                              gap: 1,
                              '& .MuiChip-root': {
                                marginBottom: '8px'
                              }
                            }}
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
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', mt: 4, width: '100%' }}>
                  <Typography variant="h6" color="text.secondary">
                    No motorcycles found
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
