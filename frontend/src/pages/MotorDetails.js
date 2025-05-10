import React, { useState, useEffect, useCallback } from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Rating,
  TextField,
  Avatar,
  Divider
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  DirectionsBike as BikeIcon,
  Star as StarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Navbar from '../components/Navbar';

const MotorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [motor, setMotor] = useState(null);
  const [motors, setMotors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [seller, setSeller] = useState(null);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: ''
  });
  const [reviewError, setReviewError] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/motors/${motor.id}/reviews`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data);
      
      // Check if user has already reviewed
      if (user) {
        const userReview = data.find(review => review.user_id === user.id);
        setHasReviewed(!!userReview);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }, [motor, user]); // Add user and motor dependency

  const handleSubmitReview = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (newReview.rating === 0) {
      setReviewError('Please select a rating');
      return;
    }

    if (hasReviewed) {
      setReviewError('You have already reviewed this motorcycle');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/motors/${motor.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newReview)
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      // Reset form and refresh reviews
      setNewReview({ rating: 0, comment: '' });
      setReviewError('');
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      setReviewError(error.message);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      // Fetch current motor details
      const motorResponse = await fetch(`http://localhost:5000/api/motors/${id}`, {
        credentials: 'include'
      });

      if (!motorResponse.ok) {
        throw new Error('Failed to fetch motor details');
      }

      const motorData = await motorResponse.json();

      // Fetch all motors to get complete info including current_status
      const allMotorsResponse = await fetch('http://localhost:5000/api/motors/public', {
        credentials: 'include'
      });

      if (!allMotorsResponse.ok) {
        throw new Error('Failed to fetch motors data');
      }

      const allMotorsData = await allMotorsResponse.json();
      
      // Get complete motor data with current_status
      const completeMotorData = allMotorsData.find(m => m.id === parseInt(id)) || motorData;
      setMotor(completeMotorData);

      // Fetch seller profile
      const sellerResponse = await fetch(`http://localhost:5000/api/seller/profile/${motorData.sellerId}`, {
        credentials: 'include'
      });

      if (sellerResponse.ok) {
        const sellerData = await sellerResponse.json();
        setSeller(sellerData);
      }
      
      // Add seller info to all motors
      const motorsWithSellers = await Promise.all(
        allMotorsData.map(async (motor) => {
          try {
            const sellerResponse = await fetch(`http://localhost:5000/api/seller/profile/${motor.sellerId}`, {
              credentials: 'include'
            });
            
            if (sellerResponse.ok) {
              const sellerData = await sellerResponse.json();
              return { ...motor, seller: sellerData };
            }
            return motor;
          } catch (error) {
            console.error('Error fetching seller:', error);
            return motor;
          }
        })
      );
     
      setMotors(motorsWithSellers);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (motor) {
      fetchReviews();
    }
  }, [fetchReviews, motor, user]);

  const handleBookNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/book/${motor.id}`);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Container sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </>
    );
  }

  if (!motor) {
    return (
      <>
        <Navbar />
        <Container sx={{ mt: 4 }}>
          <Alert severity="info">Motor not found</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardMedia
                component="img"
                height="400"
                image={motor.imageUrl ? `http://localhost:3000${motor.imageUrl}` : '/placeholder.jpg'}
                alt={motor.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" sx={{ flex: 1 }}>
                    {motor.title}
                  </Typography>
                  {seller && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {seller.profileImageUrl ? (
                        <Box
                          component="img"
                          src={'http://localhost:3000' + seller.profileImageUrl}
                          alt={seller.name}
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <Avatar sx={{ width: 40, height: 40 }}>
                          {seller.name ? seller.name[0].toUpperCase() : '?'}
                        </Avatar>
                      )}
                      <Typography variant="subtitle1" color="text.secondary">
                        Listed by {seller.name}
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                  {motor.price && (
                    <Chip
                      icon={<MoneyIcon />}
                      label={`${motor.price} MAD`}
                      color="primary"
                    />
                  )}
                  {motor.dailyRate && (
                    <Chip
                      icon={<CalendarIcon />}
                      label={`${motor.dailyRate} MAD/day`}
                      color="secondary"
                    />
                  )}
                  {motor.motorType && (
                    <Chip
                      icon={<BikeIcon />}
                      label={motor.motorType}
                    />
                  )}
                </Stack>

                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {motor.description}
                </Typography>

                <Typography variant="h6" gutterBottom>
                  Specifications
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Brand:</strong> {motor.brand}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Model:</strong> {motor.model}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Year:</strong> {motor.year}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Capacity:</strong> {motor.capacity}cc
                    </Typography>
                    <Typography variant="body2">
                      <strong>Seats:</strong> {motor.seats}
                    </Typography>
                    {motor.features && (
                      <Typography variant="body2">
                        <strong>Features:</strong> {motor.features}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h5" gutterBottom>
                Rental Information
              </Typography>
              
              {motor.dailyRate && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {motor.dailyRate} MAD
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    per day
                  </Typography>
                </Box>
              )}

              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={handleBookNow}
                disabled={motor.current_status === 'booked'}
                sx={{
                  '&.Mui-disabled': {
                    opacity: 0.7,
                    backgroundColor: '#e0e0e0',
                    cursor: 'not-allowed',
                    pointerEvents: 'auto'
                  }
                }}
              >
                Book Now
              </Button>
              {motor.current_status === 'booked' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {motor.available_after 
                    ? `This motorcycle will be available after ${new Date(motor.available_after).toLocaleDateString()}`
                    : 'This motorcycle is currently booked'}
                </Alert>
              )}

              {!user && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  Please log in to book this motorcycle
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Similar Motorcycles Section */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom>
            Similar Motorcycles
          </Typography>
          <Box sx={{ 
            mt: 2,
            position: 'relative',
            '&:hover .slick-arrow': {
              opacity: 1,
              visibility: 'visible'
            },
            '& .slick-arrow': {
              width: 40,
              height: 40,
              background: '#1976d2',
              borderRadius: '50%',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              zIndex: 1,
              opacity: 0,
              visibility: 'hidden',
              transition: 'all 0.3s ease',
              color: 'white',
              cursor: 'pointer',
              '&:hover': {
                background: '#1565c0',
                opacity: 1,
                color: 'white'
              },
              '&::before': {
                opacity: 1,
                color: 'white',
                fontSize: '24px'
              }
            },
            '& .slick-prev': {
              left: -50,
            },
            '& .slick-next': {
              right: -50,
            },
            '& .slick-disabled': {
              opacity: 0.5
            }
          }}>
            {motors.length === 0 ? (
              <Alert severity="info">Loading similar motorcycles...</Alert>
            ) : (
              <>
                {(function() {
                  // Filter out the current motorcycle
                  const otherMotors = motors.filter(m => m.id !== motor.id);
                  
                  // Define similarity criteria
                  const getSimilarityScore = (m) => {
                    let score = 0;
                    // Same brand is a strong indicator
                    if (m.brand === motor.brand) score += 3;
                    // Similar capacity (within 150cc range)
                    if (Math.abs(m.capacity - motor.capacity) <= 150) score += 2;
                    // Same type of motorcycle
                    if (m.motorType === motor.motorType) score += 2;
                    // Similar price range (within 30% difference)
                    if (m.dailyRate && motor.dailyRate) {
                      const priceRatio = Math.max(m.dailyRate, motor.dailyRate) / Math.min(m.dailyRate, motor.dailyRate);
                      if (priceRatio <= 1.3) score += 1;
                    }
                    return score;
                  };

                  // Sort by similarity score (without limiting to 3)
                  const similarMotors = otherMotors
                    .map(m => ({ ...m, similarityScore: getSimilarityScore(m) }))
                    .filter(m => m.similarityScore > 0)
                    .sort((a, b) => b.similarityScore - a.similarityScore);

                  const settings = {
                    dots: similarMotors.length > 1,
                    infinite: similarMotors.length > 1,
                    speed: 1000,
                    slidesToShow: Math.min(3, similarMotors.length),
                    slidesToScroll: 1,
                    autoplay: similarMotors.length > 1,
                    autoplaySpeed: 4000,
                    pauseOnHover: true,
                    cssEase: "linear",
                    arrows: similarMotors.length > 1,
                    nextArrow: <ChevronRightIcon sx={{ 
                      fontSize: 40, 
                      color: '#1976d2', 
                      position: 'absolute', 
                      right: '-50px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '50%',
                      padding: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      '&:hover': { 
                        transform: 'translateY(-50%) scale(1.1)',
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                      }
                    }} />,
                    prevArrow: <ChevronLeftIcon sx={{ 
                      fontSize: 40, 
                      color: '#1976d2', 
                      position: 'absolute', 
                      left: '-50px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '50%',
                      padding: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      '&:hover': { 
                        transform: 'translateY(-50%) scale(1.1)',
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                      }
                    }} />,
                    responsive: [
                      {
                        breakpoint: 1024,
                        settings: {
                          slidesToShow: Math.min(2, similarMotors.length),
                          slidesToScroll: 1,
                          arrows: similarMotors.length > 1
                        }
                      },
                      {
                        breakpoint: 600,
                        settings: {
                          slidesToShow: 1,
                          slidesToScroll: 1,
                          arrows: false,
                          dots: similarMotors.length > 1
                        }
                      }
                    ]
                  };

                  return similarMotors.length === 0 ? (
                    <Alert severity="info">No similar motorcycles found</Alert>
                  ) : (
                    <Slider {...settings}>
                      {similarMotors.map((similarMotor) => (
                        <Box key={similarMotor.id} sx={{ p: 1 }}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          height: '100%', // Make all cards same height
                          display: 'flex',
                          flexDirection: 'column',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 3,
                            transition: 'all 0.3s ease'
                          }
                        }}
                        onClick={() => navigate(`/motor/${similarMotor.id}`)}
                      >
                        <CardMedia
                          component="img"
                          height="200"
                          image={similarMotor.imageUrl ? `http://localhost:3000${similarMotor.imageUrl}` : '/placeholder.jpg'}
                          alt={similarMotor.title}
                          sx={{ objectFit: 'cover' }}
                        />
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="h6" gutterBottom>
                            {similarMotor.title}
                          </Typography>
                          
                          {/* Seller Profile */}
                          {similarMotor.seller && (
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                mb: 1,
                                '&:hover': {
                                  cursor: 'pointer',
                                  opacity: 0.8
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/seller/${similarMotor.sellerId}`);
                              }}
                            >
                              {similarMotor.seller.profileImageUrl ? (
                                <Box
                                  component="img"
                                  src={'http://localhost:3000' + similarMotor.seller.profileImageUrl}
                                  alt={similarMotor.seller.name}
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    mr: 1
                                  }}
                                />
                              ) : (
                                <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                                  {similarMotor.seller.name ? similarMotor.seller.name[0].toUpperCase() : '?'}
                                </Avatar>
                              )}
                              <Typography variant="body2" color="text.secondary">
                                {similarMotor.seller.name}
                              </Typography>
                            </Box>
                          )}

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {[
                              similarMotor.brand === motor.brand ? 'Same brand' : null,
                              Math.abs(similarMotor.capacity - motor.capacity) <= 150 ? 'Similar capacity' : null,
                              similarMotor.motorType === motor.motorType ? 'Same type' : null,
                              similarMotor.dailyRate && motor.dailyRate && 
                              Math.max(similarMotor.dailyRate, motor.dailyRate) / Math.min(similarMotor.dailyRate, motor.dailyRate) <= 1.3 
                                ? 'Similar price' : null
                            ].filter(Boolean).join(' • ')}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                            {similarMotor.price && (
                              <Chip
                                icon={<MoneyIcon />}
                                label={`${similarMotor.price} MAD`}
                                size="small"
                                color="primary"
                              />
                            )}
                            {similarMotor.dailyRate && (
                              <Chip
                                icon={<CalendarIcon />}
                                label={`${similarMotor.dailyRate} MAD/day`}
                                size="small"
                                color="secondary"
                              />
                            )}
                            {similarMotor.current_status === 'booked' ? (
                              <Chip
                                icon={<CalendarIcon />}
                                label={similarMotor.available_after 
                                  ? `Available ${new Date(similarMotor.available_after).toLocaleDateString('fr-MA')}`
                                  : 'Currently Booked'}
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
                        </CardContent>
                      </Card>
                        </Box>
                      ))}
                    </Slider>
                  )
                })()}
              </>
            )}
          </Box>
        </Box>

        {/* Reviews Section */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom>
            Reviews
          </Typography>

          {/* Add Review Form */}
          {user && user.id !== motor.sellerId && !hasReviewed ? (
            <Card sx={{ mb: 4, p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Write a Review
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Rating
                  value={newReview.rating}
                  onChange={(event, newValue) => {
                    setNewReview({ ...newReview, rating: newValue });
                  }}
                  size="large"
                />
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Share your experience with this motorcycle..."
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                sx={{ mb: 2 }}
              />
              {reviewError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {reviewError}
                </Alert>
              )}
              <Button
                variant="contained"
                onClick={handleSubmitReview}
                startIcon={<StarIcon />}
              >
                Submit Review
              </Button>
            </Card>
          ) : user && user.id !== motor.sellerId && hasReviewed ? (
            <Alert severity="info" sx={{ mb: 4 }}>
              You have already reviewed this motorcycle
            </Alert>
          ) : null}

          {/* Reviews List */}
          <Stack spacing={2}>
            {reviews.length === 0 ? (
              <Alert severity="info">No reviews yet</Alert>
            ) : (
              reviews.map((review) => (
                <Card key={review.id} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar 
                      src={review.profile_image_url ? `http://localhost:3000${review.profile_image_url}` : null}
                      sx={{ mr: 2 }}
                    >
                      {review.name ? review.name[0].toUpperCase() : '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">
                        {review.name}
                      </Typography>
                      <Rating value={review.rating} readOnly size="small" />
                    </Box>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ ml: 'auto' }}
                    >
                      {new Date(review.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  {editingReviewId === review.id ? (
                    <Box sx={{ mt: 2 }}>
                      <Rating
                        value={newReview.rating}
                        onChange={(event, newValue) => {
                          setNewReview({ ...newReview, rating: newValue });
                        }}
                        size="small"
                      />
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        sx={{ my: 1 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          size="small"
                          variant="contained"
                          onClick={async () => {
                            try {
                              // First fetch the updated review data
                              const response = await fetch(`http://localhost:5000/api/motors/${motor.id}/reviews/${review.id}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json'
                                },
                                credentials: 'include',
                                body: JSON.stringify({
                                  rating: newReview.rating,
                                  comment: newReview.comment
                                })
                              });

                              if (!response.ok) {
                                throw new Error('Failed to update review');
                              }

                              // Refresh the reviews to get the updated data
                              await fetchReviews();
                              
                              // Reset the edit state
                              setEditingReviewId(null);
                              setNewReview({ rating: 0, comment: '' });
                            } catch (error) {
                              console.error('Error updating review:', error);
                              setReviewError(error.message);
                            }
                          }}
                        >
                          Save
                        </Button>
                        <Button 
                          size="small"
                          onClick={() => {
                            setEditingReviewId(null);
                            setNewReview({ rating: 0, comment: '' });
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {review.comment}
                      </Typography>
                      {user && (user.id === review.user_id || user.role === 'admin' || (seller && user.id === seller.id)) && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {user.id === review.user_id && (
                            <Button 
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => {
                                setEditingReviewId(review.id);
                                setNewReview({
                                  rating: review.rating,
                                  comment: review.comment
                                });
                              }}
                            >
                              Edit Review
                            </Button>
                          )}
                          <Button 
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={async () => {
                              try {
                                const response = await fetch(`http://localhost:5000/api/motors/${motor.id}/reviews/${review.id}`, {
                                  method: 'DELETE',
                                  credentials: 'include'
                                });

                                if (!response.ok) {
                                  throw new Error('Failed to delete review');
                                }

                                // Refresh reviews after deletion
                                fetchReviews();
                              } catch (error) {
                                console.error('Error deleting review:', error);
                                setReviewError('Failed to delete review');
                              }
                            }}
                          >
                            Delete Review
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                  {review.seller_response && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ pl: 2, borderLeft: 2, borderColor: 'primary.main' }}>
                        <Typography variant="subtitle2" color="primary">
                          Seller Response:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {review.seller_response}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Card>
              ))
            )}
          </Stack>
        </Box>
      </Container>
    </>
  );
};

export default MotorDetails;
