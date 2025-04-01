const express = require("express");
const router = express.Router();
const Cart = require("../Models/Cart");
const Product = require("../Models/Product");
const mongoose = require("mongoose");


router.post("/add", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    console.log("Request Body:", { userId, productId, quantity });

    if (!userId || !productId || !quantity) {
      return res.status(400).json({ error: "All fields are required" });
    }

  
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({ error: "Invalid userId or productId" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }


    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {

      cart.items[itemIndex].quantity += quantity;
    } else {

      cart.items.push({ product: productId, quantity });
    }

    product.stock -= quantity;
    await product.save();

 
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate("items.product");

    res.status(201).json({
      success: true,
      message: "Item successfully added to cart",
      cart: populatedCart,
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Something went wrong!",
    });
  }
});

router.delete("/remove/:userId/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({ error: "Invalid userId or productId" });
    }
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Item not found in cart",
      });
    }

    const product = await Product.findById(productId);
    if (product) {
      product.stock += cart.items[itemIndex].quantity;
      await product.save();
    }

    cart.items.splice(itemIndex, 1);


    await cart.save();
e
    const populatedCart = await Cart.findById(cart._id).populate("items.product");

    res.status(200).json({
      success: true,
      message: "Item successfully removed from cart",
      cart: populatedCart,
    });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Something went wrong!",
    });
  }
});

router.delete("/clear/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const cart = await Cart.findOneAndDelete({ user: userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Something went wrong!",
    });
  }
});

router.get("/history/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid userId" });
      }
  
      const cart = await Cart.findOne({ user: userId }).populate("items.product");
  
      if (!cart) {
        return res.status(404).json({ error: "Cart not found" });
      }
  
   
      res.status(200).json({
        success: true,
        cart: cart.items, 
      });
    } catch (error) {
      console.error("Error fetching cart history:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Something went wrong!",
      });
    }
  });

router.put("/update/:userId/:productId", async (req, res) => {
    try {
      const { userId, productId } = req.params;
      const { quantity } = req.body;
      if (!quantity || quantity < 1) {
        return res.status(400).json({ error: "Invalid quantity" });
      }
      if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(productId)
      ) {
        return res.status(400).json({ error: "Invalid userId or productId" });
      }

      const cart = await Cart.findOne({ user: userId });
  
      if (!cart) {
        return res.status(404).json({ error: "Cart not found" });
      }
  
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );
  
      if (itemIndex === -1) {
        return res.status(404).json({ error: "Item not found in cart" });
      }
  
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      const oldQuantity = cart.items[itemIndex].quantity;
      const quantityDifference = quantity - oldQuantity;

      if (product.stock < quantityDifference) {
        return res.status(400).json({ error: "Insufficient stock" });
      }

      cart.items[itemIndex].quantity = quantity;
      product.stock -= quantityDifference;
      await product.save();
      await cart.save();

      const populatedCart = await Cart.findById(cart._id).populate("items.product");
  
      res.status(200).json({
        success: true,
        message: "Quantity updated successfully",
        cart: populatedCart,
      });
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Something went wrong!",
      });
    }
  });
  
module.exports = router;