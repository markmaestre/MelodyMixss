
const express = require("express");
const router = express.Router();
const Review = require("../Models/Review"); 
const mongoose = require("mongoose");

// Fetch reviews and ratings for a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // Find all reviews for the user and populate the order details
    const reviews = await Review.find({ userId }).populate("orderId");

    // Return the reviews
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Something went wrong!",
    });
  }
});

// Submit a review
router.post("/create", async (req, res) => {
  try {
    const { orderId, userId, review, rating } = req.body;

    // Validate input
    if (!orderId || !userId || !review || !rating) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Create a new review
    const newReview = new Review({
      orderId,
      userId,
      review,
      rating,
    });

    // Save the review
    await newReview.save();

    // Return success response
    res.status(201).json({ success: true, message: "Review submitted successfully!" });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Something went wrong!",
    });
  }
});


router.put("/update/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { review, rating } = req.body;

    // Validate input
    if (!review || !rating) {
      return res.status(400).json({ error: "Review and rating are required" });
    }

    // Find and update the review
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { review, rating },
      { new: true }
    );

    if (!updatedReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Return success response
    res.status(200).json({ success: true, message: "Review updated successfully!", updatedReview });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Something went wrong!",
    });
  }
});

module.exports = router;