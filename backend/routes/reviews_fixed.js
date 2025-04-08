const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// Get reviews for a specific motor
router.get('/motors/:motorId/reviews', async (req, res) => {
  try {
    const { motorId } = req.params;
    
    // Get reviews with user info
    const [reviews] = await db.query(
      `SELECT r.id, r.motor_id, r.user_id, r.rating, r.comment, r.created_at, r.seller_response,
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
        COALESCE(ROUND(AVG(rating), 1), 0) as average_rating,
        COALESCE(SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END), 0) as five_star,
        COALESCE(SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END), 0) as four_star,
        COALESCE(SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END), 0) as three_star,
        COALESCE(SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END), 0) as two_star,
        COALESCE(SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END), 0) as one_star
       FROM reviews
       WHERE motor_id = ?`,
      [motorId]
    );

    res.json({
      reviews,
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
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get all reviews for a seller
router.get('/seller/:sellerId/reviews', async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    // Get all reviews for seller's motors
    const [reviews] = await db.query(
      `SELECT r.id, r.motor_id, r.user_id, r.rating, r.comment, r.created_at, r.seller_response,
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
        COALESCE(ROUND(AVG(rating), 1), 0) as average_rating,
        COALESCE(SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END), 0) as five_star,
        COALESCE(SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END), 0) as four_star,
        COALESCE(SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END), 0) as three_star,
        COALESCE(SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END), 0) as two_star,
        COALESCE(SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END), 0) as one_star
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
router.post('/motors/:motorId/reviews', verifyToken, async (req, res) => {
  try {
    const motorId = req.params.motorId;
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

    // Check if user is not the seller
    const [motor] = await db.query(
      'SELECT sellerId FROM motors WHERE id = ?',
      [motorId]
    );

    if (!motor.length) {
      return res.status(404).json({ error: 'Motorcycle not found' });
    }

    if (motor[0].sellerId === userId) {
      return res.status(400).json({ error: 'You cannot review your own motorcycle' });
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
      motor_id: motorId,
      user_id: userId,
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

// Add seller response to a review
router.post('/reviews/:reviewId/response', verifyToken, async (req, res) => {
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

    // Add seller response
    await db.query(
      `UPDATE reviews 
       SET seller_response = ?
       WHERE id = ?`,
      [response, reviewId]
    );

    res.json({ message: 'Response added successfully' });
  } catch (error) {
    console.error('Error adding seller response:', error);
    res.status(500).json({ error: 'Failed to add response' });
  }
});

module.exports = router;
