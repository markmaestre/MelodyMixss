// routes/discountRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../Models/Product');
const ProductDiscount = require('../Models/ProductDiscount');

// Middleware to check if product already has an active discount
const checkExistingDiscount = async (req, res, next) => {
  try {
    const existingDiscount = await ProductDiscount.findOne({
      product: req.body.product,
      isActive: true,
      $or: [
        { endDate: { $gte: new Date() } },
        { endDate: null }
      ]
    });

    if (existingDiscount && req.method === 'POST') {
      return res.status(400).json({
        message: 'Product already has an active discount. Please end the current discount before creating a new one.'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new discount
router.post('/create', checkExistingDiscount, async (req, res) => {
  try {
    // Validate product exists
    const product = await Product.findById(req.body.product);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate discount percentage
    if (req.body.discountPercentage <= 0 || req.body.discountPercentage >= 100) {
      return res.status(400).json({ message: 'Discount percentage must be between 0 and 100' });
    }

    // Validate dates if provided
    if (req.body.endDate && new Date(req.body.endDate) <= new Date(req.body.startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const discount = new ProductDiscount({
      product: req.body.product,
      discountPercentage: req.body.discountPercentage,
      startDate: req.body.startDate || new Date(),
      endDate: req.body.endDate,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    });

    const savedDiscount = await discount.save();
    
    // Update product with discount reference (optional)
    product.discount = savedDiscount._id;
    await product.save();

    res.status(201).json(savedDiscount);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all discounts
router.get('/', async (req, res) => {
  try {
    const discounts = await ProductDiscount.find()
      .populate('product', 'name price')
      .sort({ createdAt: -1 });
    
    res.json(discounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get discount by ID
router.get('/:id', async (req, res) => {
  try {
    const discount = await ProductDiscount.findById(req.params.id)
      .populate('product', 'name price image');
    
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    
    res.json(discount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a discount
router.patch('/:id', async (req, res) => {
  try {
    const discount = await ProductDiscount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    // Prevent updating if discount is already expired
    if (discount.endDate && new Date(discount.endDate) < new Date() && req.body.isActive) {
      return res.status(400).json({ 
        message: 'Cannot activate an expired discount. Please create a new one.' 
      });
    }

    // Update fields
    if (req.body.discountPercentage !== undefined) {
      discount.discountPercentage = req.body.discountPercentage;
    }
    if (req.body.startDate !== undefined) {
      discount.startDate = req.body.startDate;
    }
    if (req.body.endDate !== undefined) {
      discount.endDate = req.body.endDate;
    }
    if (req.body.isActive !== undefined) {
      discount.isActive = req.body.isActive;
    }

    const updatedDiscount = await discount.save();
    res.json(updatedDiscount);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a discount
router.delete('/:id', async (req, res) => {
  try {
    const discount = await ProductDiscount.findByIdAndDelete(req.params.id);
    
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    // Remove discount reference from product (optional)
    await Product.updateOne(
      { _id: discount.product },
      { $unset: { discount: "" } }
    );

    res.json({ message: 'Discount deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/active/now', async (req, res) => {
  try {
    const now = new Date();
    const activeDiscounts = await ProductDiscount.find({
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: { $gte: now } },
        { endDate: null }
      ]
    }).populate('product', 'name price image');

    res.json(activeDiscounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;