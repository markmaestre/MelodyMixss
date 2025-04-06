const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Checkout",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  review: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add text index for search functionality
ReviewSchema.index({ review: 'text' });

// Virtual populate to get checkout details
ReviewSchema.virtual('orderDetails', {
  ref: 'Checkout',
  localField: 'orderId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate to get product details
ReviewSchema.virtual('productDetails', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model("Review", ReviewSchema);