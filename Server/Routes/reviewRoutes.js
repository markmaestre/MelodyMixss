const express = require("express");
const router = express.Router();
const Review = require("../Models/Review");
const Product = require("../Models/Product");
const Checkout = require("../Models/Checkout");
const mongoose = require("mongoose");

const updateProductRating = async (productId) => {
  const reviews = await Review.find({ productId });
  const ratingCount = reviews.length;
  const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = ratingSum / ratingCount;

  await Product.findByIdAndUpdate(productId, {
    rating: averageRating,
    ratingCount
  });
};

// Fetch ALL reviews with product details
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("userId", "name email") // Only get name and email from user
      .populate("orderId", "status createdAt") // Only get status and date from order
      .populate("productId", "name image price"); // Get product details

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    res.status(500).json({
      success: false,
      error: "Server Error"
    });
  }
});

// Fetch reviews for a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid user ID" 
      });
    }

    const reviews = await Review.find({ userId })
      .populate("productId", "name image")
      .populate("orderId", "createdAt");

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No reviews found for this user"
      });
    }

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({
      success: false,
      error: "Server Error"
    });
  }
});

// Fetch reviews for a specific product
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid product ID" 
      });
    }

    const reviews = await Review.find({ productId })
      .populate("userId", "name")
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    res.status(500).json({
      success: false,
      error: "Server Error"
    });
  }
});

// Submit a new review
router.post("/", async (req, res) => {
  try {
    const { orderId, userId, productId, review, rating } = req.body;

    // Validation
    if (!orderId || !userId || !productId || !review || !rating) {
      return res.status(400).json({
        success: false,
        error: "All fields are required (orderId, userId, productId, review, rating)"
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5"
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found"
      });
    }

    // Check if order exists and contains the product
    const order = await Checkout.findOne({
      _id: orderId,
      "items.product": productId
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        error: "Order not found or product not in order"
      });
    }

    // Check if user already reviewed this product from this order
    const existingReview = await Review.findOne({ orderId, productId, userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: "You have already reviewed this product from this order"
      });
    }

    // Create review
    const newReview = new Review({
      orderId,
      userId,
      productId,
      review,
      rating
    });

    await newReview.save();

    // Update product rating stats
    await updateProductRating(productId);

    // Update order status if needed
    if (order.status !== "Reviewed") {
      order.status = "Reviewed";
      await order.save();
    }

    res.status(201).json({
      success: true,
      data: newReview
    });

  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({
      success: false,
      error: "Server Error"
    });
  }
});

// Update a review
router.put("/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { review, rating } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid review ID" 
      });
    }

    if (!review || !rating) {
      return res.status(400).json({
        success: false,
        error: "Review and rating are required"
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5"
      });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { review, rating },
      { new: true, runValidators: true }
    ).populate("productId", "name");

    if (!updatedReview) {
      return res.status(404).json({
        success: false,
        error: "Review not found"
      });
    }

    // Update product rating stats
    await updateProductRating(updatedReview.productId._id);

    res.status(200).json({
      success: true,
      data: updatedReview
    });

  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      error: "Server Error"
    });
  }
});

// Delete a review
router.delete("/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid review ID" 
      });
    }

    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: "Review not found"
      });
    }

    // Update product rating stats
    await updateProductRating(review.productId);

    res.status(200).json({
      success: true,
      data: {}
    });

  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      error: "Server Error"
    });
  }
});

module.exports = router;