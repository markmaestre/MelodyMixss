
const express = require("express");
const router = express.Router();
const Checkout = require("../Models/Checkout");
const Cart = require("../Models/Cart");
const mongoose = require("mongoose");

router.post("/checkout", async (req, res) => {
  try {
    const { userId, address, phone, paymentType } = req.body;


    if (!userId || !address || !phone || !paymentType) {
      return res.status(400).json({ error: "All fields are required" });
    }

    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

   
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ error: "Cart is empty" });
    }

    const totalAmount = cart.items.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);

    const checkoutOrder = new Checkout({
      user: userId,
      items: cart.items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      })),
      totalAmount,
      address,
      phone,
      paymentType,
      status: "Pending", 
    });

    
    await checkoutOrder.save();


    await Cart.findOneAndDelete({ user: userId });

 
    res.status(201).json({
      success: true,
      message: "Checkout successful!",
      order: checkoutOrder,
    });
  } catch (error) {
    console.error("Error during checkout:", error);
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

      const checkoutHistory = await Checkout.find({ user: userId }).populate("items.product");

      res.status(200).json(checkoutHistory);
    } catch (error) {
      console.error("Error fetching checkout history:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Something went wrong!",
      });
    }
  });


router.get("/all", async (req, res) => {
  try {
    const checkouts = await Checkout.find().populate("user", "username email").populate("items.product");
    res.status(200).json(checkouts);
  } catch (error) {
    console.error("Error fetching all checkouts:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Something went wrong!",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid checkout ID" });
    }

    const checkout = await Checkout.findById(id)
      .populate("user", "username email")
      .populate("items.product");

    if (!checkout) {
      return res.status(404).json({ error: "Checkout not found" });
    }

    res.status(200).json(checkout);
  } catch (error) {
    console.error("Error fetching checkout:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Something went wrong!",
    });
  }
});

// Update checkout status
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid checkout ID" });
    }

    const validStatuses = ["Pending", "Shipped", "Delivered", "Cancelled", "Reviewed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updatedCheckout = await Checkout.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("user", "username email");

    if (!updatedCheckout) {
      return res.status(404).json({ error: "Checkout not found" });
    }

    res.status(200).json({
      success: true,
      message: "Checkout status updated successfully",
      checkout: updatedCheckout,
    });
  } catch (error) {
    console.error("Error updating checkout:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Something went wrong!",
    });
  }
});
  
module.exports = router;