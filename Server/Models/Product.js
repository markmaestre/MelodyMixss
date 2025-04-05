// models/Product.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 0, 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add virtual field for discounted price
ProductSchema.virtual('discountedPrice').get(function() {
  if (this.discount && this.discount.isActive) {
    return this.price * (1 - this.discount.discountPercentage / 100);
  }
  return this.price;
});

// Add virtual field to check if product is on discount
ProductSchema.virtual('isOnDiscount').get(function() {
  return !!this.discount && this.discount.isActive;
});

module.exports = mongoose.model("Product", ProductSchema);