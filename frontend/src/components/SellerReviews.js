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
  LinearProgress,
  TablePagination
} from '@mui/material';
import {
  Reply as ReplyIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useUser } from '../context/UserContext';

const SellerReviews = () => {
  const { user } = useUser();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
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
  const [editingReviewId, setEditingReviewId] = useState(null);

  const fetchReviews = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await axios.get(`http://localhost:5000/api/reviews/seller/${user.id}`, {
        withCredentials: true
      });

      // Transform the data and ensure numeric values
      const transformedData = {
        reviews: response.data.reviews || [],
        stats: {
          totalReviews: Number(response.data.stats.totalReviews) || 0,
          averageRating: Number(response.data.stats.averageRating) || 0,
          ratingBreakdown: {
            5: Number(response.data.stats.ratingBreakdown[5]) || 0,
            4: Number(response.data.stats.ratingBreakdown[4]) || 0,
            3: Number(response.data.stats.ratingBreakdown[3]) || 0,
            2: Number(response.data.stats.ratingBreakdown[2]) || 0,
            1: Number(response.data.stats.ratingBreakdown[1]) || 0
          }
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
      const method = editingReviewId === reviewId ? 'put' : 'post';
      await axios({
        method,
        url: `http://localhost:5000/api/reviews/${reviewId}/response`,
        data: { response: replyText[reviewId] },
        withCredentials: true
      });

      // Clear reply text and editing state
      setReplyText(prev => ({ ...prev, [reviewId]: '' }));
      setEditingReviewId(null);
      
      // Refresh reviews
      fetchReviews();
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await axios.delete(
                          `http://localhost:5000/api/reviews/${reviewId}`,
          { withCredentials: true }
        );
        fetchReviews();
      } catch (error) {
        console.error('Error deleting review:', error);
      }
    }
  };

  const getRatingPercentage = (count) => {
    return reviewsData.stats.totalReviews > 0 
      ? (count / reviewsData.stats.totalReviews) * 100 
      : 0;
  };
  console.log(reviewsData)

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Stats Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" gutterBottom>
                  {(reviewsData.stats.averageRating || 0).toFixed(1)}
                </Typography>
                <Rating 
                  value={Number(reviewsData.stats.averageRating) || 0} 
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
        {reviewsData.reviews
          .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
          .map((review) => (
          <Paper key={review.id} sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {review.customerName?.[0] || 'U'}
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
                    • {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Rating value={Number(review.rating) || 0} readOnly size="small" />
                  <Chip 
                    label={review.motorName || 'Motorcycle'}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {review.comment}
                </Typography>

                {review.seller_response && !editingReviewId ? (
                  <Box sx={{ ml: 4, mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckIcon color="success" fontSize="small" />
                        <Typography variant="subtitle2">
                          Your Response
                        </Typography>
                      </Box>
                      <Box>
                        <Button
                          size="small"
                          onClick={() => {
                            setReplyText({ ...replyText, [review.id]: review.seller_response });
                            setEditingReviewId(review.id);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={async () => {
                            try {
                              const response = await axios.delete(
                                `http://localhost:5000/api/reviews/${review.id}/response`,
                                { withCredentials: true }
                              );
                              if (response.status === 200) {
                                fetchReviews();
                              }
                            } catch (error) {
                              console.error('Error deleting response:', error);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Box>
                    <Typography variant="body2">
                      {review.seller_response}
                    </Typography>
                  </Box>
                ) : (
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
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<ReplyIcon />}
                        size="small"
                        onClick={() => handleReply(review.id)}
                        disabled={!replyText[review.id]}
                      >
                        {editingReviewId === review.id ? 'Update' : 'Reply'}
                      </Button>
                      {editingReviewId === review.id && (
                        <Button
                          size="small"
                          onClick={() => {
                            setEditingReviewId(null);
                            setReplyText(prev => ({ ...prev, [review.id]: '' }));
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDeleteReview(review.id)}
                  >
                    Delete Review
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>
      <Box sx={{ mt: 2 }}>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={reviewsData.reviews.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Box>
    </Box>
  );
};

export default SellerReviews;
