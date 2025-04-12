import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Typography,
  Rating,
  TextField,
  Button,
  Stack,
  Avatar,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Reply as ReplyIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useUser } from '../context/UserContext';

const SellerReviews = () => {
  const { user } = useUser();
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    stats: {
      totalReviews: 0,
      averageRating: 0,
      ratingBreakdown: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      }
    }
  });
  const [replyText, setReplyText] = useState({});

  const fetchReviews = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await axios.get(`http://localhost:5000/api/seller/${user.id}/reviews`, {
        withCredentials: true
      });

      // Transform the data to match the expected format
      const transformedData = {
        reviews: response.data.reviews,
        stats: {
          totalReviews: response.data.stats.totalReviews,
          averageRating: response.data.stats.averageRating,
          ratingBreakdown: response.data.stats.ratingBreakdown
        }
      };

      setReviewsData(transformedData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleReply = async (reviewId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/reviews/${reviewId}/response`,
        { response: replyText[reviewId] },
        { withCredentials: true }
      );

      // Update local state to show the reply immediately
      setReviewsData(prev => ({
        ...prev,
        reviews: prev.reviews.map(review => {
          if (review.id === reviewId) {
            return {
              ...review,
              seller_response: replyText[reviewId]
            };
          }
          return review;
        })
      }));

      // Clear reply text
      setReplyText(prev => ({ ...prev, [reviewId]: '' }));
      
      // Refresh reviews
      fetchReviews();
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const getRatingPercentage = (count) => {
    return reviewsData.stats.totalReviews > 0 
      ? (count / reviewsData.stats.totalReviews) * 100 
      : 0;
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Stats Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" gutterBottom>
                  {reviewsData.stats.averageRating.toFixed(1)}
                </Typography>
                <Rating 
                  value={reviewsData.stats.averageRating} 
                  precision={0.1} 
                  readOnly 
                  size="large"
                  sx={{ mb: 1 }}
                />
                <Typography variant="h6" color="text.secondary">
                  {reviewsData.stats.totalReviews} {reviewsData.stats.totalReviews === 1 ? 'review' : 'reviews'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Stack spacing={2}>
                {[5, 4, 3, 2, 1].map((star) => (
                  <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ minWidth: 60 }}>
                      {star} stars
                    </Typography>
                    <Box sx={{ 
                      flexGrow: 1, 
                      bgcolor: 'grey.200',
                      height: 8,
                      borderRadius: 1,
                      position: 'relative'
                    }}>
                      <Box sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        bgcolor: 'primary.main',
                        borderRadius: 1,
                        width: `${getRatingPercentage(reviewsData.stats.ratingBreakdown[star])}%`
                      }} />
                    </Box>
                    <Typography sx={{ minWidth: 30, textAlign: 'right' }}>
                      {reviewsData.stats.ratingBreakdown[star] || 0}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Stack spacing={2}>
        {reviewsData.reviews.map((review) => (
          <Paper key={review.id} sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {review.name?.[0] || 'U'}
                </Avatar>
              </Grid>
              <Grid item xs>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" component="span">
                    {review.name}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    component="span"
                    sx={{ ml: 1 }}
                  >
                    • {new Date(review.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Rating value={review.rating} readOnly size="small" />
                  <Chip 
                    label={review.motorDetails || 'Motorcycle'}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {review.comment}
                </Typography>

                {review.seller_response && (
                  <Box sx={{ ml: 4, mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CheckIcon color="success" fontSize="small" />
                      <Typography variant="subtitle2">
                        Your Response
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {review.seller_response}
                    </Typography>
                  </Box>
                )}

                {!review.seller_response && (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Write a response..."
                      value={replyText[review.id] || ''}
                      onChange={(e) => setReplyText(prev => ({
                        ...prev,
                        [review.id]: e.target.value
                      }))}
                      sx={{ mb: 1 }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<ReplyIcon />}
                      size="small"
                      onClick={() => handleReply(review.id)}
                      disabled={!replyText[review.id]}
                    >
                      Reply
                    </Button>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

export default SellerReviews;
