const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// Get reviews for a specific motor
router.get('/', async (req, res) => {
  try {
    const motorId = req.motorId;
    
    // Get reviews with user info
    const [reviews] = await db.query(
      `SELECT r.id, r.motor_id as motorId, r.user_id as userId, r.rating, r.comment, r.created_at, r.seller_response,
              u.username as name, u.profileImageUrl as profile_image_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.motor_id = ?
       ORDER BY r.created_at DESC`,
      [motorId]
    );

    // Get rating statistics
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total_reviews,
        COALESCE(ROUND(AVG(r.rating), 1), 0) as average_rating,
        COALESCE(SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END), 0) as five_star,
        COALESCE(SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END), 0) as four_star,
        COALESCE(SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END), 0) as three_star,
        COALESCE(SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END), 0) as two_star,
        COALESCE(SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END), 0) as one_star
       FROM reviews r
       WHERE r.motor_id = ?`,
      [motorId]
    );

    // Format reviews to match frontend expectations
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      user_id: review.userId,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      seller_response: review.seller_response,
      name: review.name,
      profile_image_url: review.profile_image_url
    }));

    res.json(formattedReviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get all reviews for a seller
router.get('/seller/:sellerId', verifyToken, async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    // Get all reviews for seller's motors
    const [reviews] = await db.query(
      `SELECT r.id, r.motor_id as motorId, r.user_id as userId, r.rating, r.comment, r.created_at, r.seller_response,
              u.username as name, u.profileImageUrl as profile_image_url,
              m.title as motor_name, m.brand as motor_brand, m.model as motor_model
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN motors m ON r.motor_id = m.id
       WHERE m.sellerId = ?
       ORDER BY r.created_at DESC`,
      [sellerId]
    );

    // Get overall rating statistics for seller
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total_reviews,
        COALESCE(ROUND(AVG(r.rating), 1), 0) as average_rating,
        COALESCE(SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END), 0) as five_star,
        COALESCE(SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END), 0) as four_star,
        COALESCE(SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END), 0) as three_star,
        COALESCE(SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END), 0) as two_star,
        COALESCE(SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END), 0) as one_star
       FROM reviews r
       JOIN motors m ON r.motor_id = m.id
       WHERE m.sellerId = ?`,
      [sellerId]
    );

    res.json({
      reviews: reviews.map(review => ({
        ...review,
        motorDetails: `${review.motor_brand} ${review.motor_model}`,
        motorName: review.motor_name
      })),
      stats: {
        totalReviews: parseInt(stats[0].total_reviews),
        averageRating: parseFloat(stats[0].average_rating),
        ratingBreakdown: {
          5: parseInt(stats[0].five_star),
          4: parseInt(stats[0].four_star),
          3: parseInt(stats[0].three_star),
          2: parseInt(stats[0].two_star),
          1: parseInt(stats[0].one_star)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching seller reviews:', error);
    res.status(500).json({ error: 'Failed to fetch seller reviews' });
  }
});

// Add a review for a motor
router.post('/', verifyToken, async (req, res) => {
  try {
    const motorId = req.motorId;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    // Check if user has already reviewed this motor
    const [existingReview] = await db.query(
      'SELECT COUNT(*) as count FROM reviews WHERE motor_id = ? AND user_id = ? LIMIT 1',
      [motorId, userId]
    );

    if (existingReview[0].count > 0) {
      return res.status(400).json({ error: 'You have already reviewed this motorcycle' });
    }

    // Insert the review
    const [result] = await db.query(
      `INSERT INTO reviews (motor_id, user_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
      [motorId, userId, rating, comment || null]
    );

    // Get user info for the response
    const [userInfo] = await db.query(
      `SELECT u.username as name, u.profileImageUrl as profile_image_url
       FROM users u
       WHERE u.id = ?`,
      [userId]
    );

    const review = {
      id: result.insertId,
      motorId: motorId,
      userId: userId,
      rating,
      comment,
      created_at: new Date(),
      seller_response: null,
      name: userInfo[0].name,
      profile_image_url: userInfo[0].profile_image_url
    };

    res.status(201).json(review);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// Update a review
router.put('/:reviewId', verifyToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    // Verify the review exists and belongs to the user
    const [review] = await db.query(
      'SELECT * FROM reviews WHERE id = ? AND user_id = ?',
      [reviewId, userId]
    );

    if (!review.length) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    // Update the review
    await db.query(
      `UPDATE reviews 
       SET rating = ?, comment = ?
       WHERE id = ? AND user_id = ?`,
      [rating, comment, reviewId, userId]
    );

    // Get updated review with user info
    const [updatedReview] = await db.query(
      `SELECT r.*, u.username as name, u.profileImageUrl as profile_image_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [reviewId]
    );

    res.json({
      id: updatedReview[0].id,
      user_id: updatedReview[0].user_id,
      rating: updatedReview[0].rating,
      comment: updatedReview[0].comment,
      created_at: updatedReview[0].created_at,
      seller_response: updatedReview[0].seller_response,
      name: updatedReview[0].name,
      profile_image_url: updatedReview[0].profile_image_url
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Add seller response to a review
router.post('/:reviewId/response', verifyToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;
    const sellerId = req.user.id;

    // Verify seller owns the motor and response doesn't exist
    const [review] = await db.query(
      `SELECT r.*, m.sellerId 
       FROM reviews r
       JOIN motors m ON r.motor_id = m.id
       WHERE r.id = ?`,
      [reviewId]
    );

    if (!review.length) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review[0].sellerId !== sellerId) {
      return res.status(403).json({ error: 'Not authorized to respond to this review' });
    }

    if (review[0].seller_response) {
      return res.status(400).json({ error: 'Response already exists. Use PUT to update.' });
    }

    // Add seller response
    await db.query(
      `UPDATE reviews 
       SET seller_response = ?
       WHERE id = ?`,
      [response, reviewId]
    );

    res.json({ message: 'Response added successfully' });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ error: 'Failed to add response' });
  }
});

// Update seller response
router.put('/:reviewId/response', verifyToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;
    const sellerId = req.user.id;

    // Verify seller owns the motor
    const [review] = await db.query(
      `SELECT r.*, m.sellerId 
       FROM reviews r
       JOIN motors m ON r.motor_id = m.id
       WHERE r.id = ?`,
      [reviewId]
    );

    if (!review.length) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review[0].sellerId !== sellerId) {
      return res.status(403).json({ error: 'Not authorized to respond to this review' });
    }

    // Add or update seller response
    await db.query(
      `UPDATE reviews 
       SET seller_response = ?
       WHERE id = ?`,
      [response, reviewId]
    );

    res.json({ message: 'Response updated successfully' });
  } catch (error) {
    console.error('Error updating response:', error);
    res.status(500).json({ error: 'Failed to update response' });
  }
});

// Delete seller response
router.delete('/:reviewId/response', verifyToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const sellerId = req.user.id;

    // Verify seller owns the motor
    const [review] = await db.query(
      `SELECT r.*, m.sellerId 
       FROM reviews r
       JOIN motors m ON r.motor_id = m.id
       WHERE r.id = ?`,
      [reviewId]
    );

    if (!review.length) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review[0].sellerId !== sellerId) {
      return res.status(403).json({ error: 'Not authorized to delete this response' });
    }

    // Delete seller response
    await db.query(
      `UPDATE reviews 
       SET seller_response = NULL
       WHERE id = ?`,
      [reviewId]
    );

    res.json({ message: 'Response deleted successfully' });
  } catch (error) {
    console.error('Error deleting response:', error);
    res.status(500).json({ error: 'Failed to delete response' });
  }
});

// Delete a review
router.delete('/:reviewId', verifyToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Get review with motor seller info
    const [review] = await db.query(
      `SELECT r.*, m.sellerId 
       FROM reviews r
       JOIN motors m ON r.motor_id = m.id
       WHERE r.id = ?`,
      [reviewId]
    );

    if (!review.length) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Allow deletion if user is admin, review owner, or the seller of the motor
    if (!isAdmin && review[0].user_id !== userId && review[0].sellerId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    // Delete the review
    await db.query(
      'DELETE FROM reviews WHERE id = ?',
      [reviewId]
    );

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;
