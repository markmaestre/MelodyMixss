const express = require("express");
const router = express.Router();
const Product = require("../Models/Product");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post("/add", async (req, res) => {
  try {
    const { name, description, price, image, stock } = req.body;

    if (!name || !description || !price || !image || stock === undefined) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (typeof image !== "string" || !image.startsWith("data:image/")) {
      return res.status(400).json({ error: "Invalid image format. Please provide a valid base64 image." });
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: "products",
    });


    const product = new Product({
      name,
      description,
      price,
      image: result.secure_url,
      stock,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: error.message || "Something went wrong!" });
  }
});

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: error.message || "Something went wrong!" });
  }
});

// Get a single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: error.message || "Something went wrong!" });
  }
});

// Update a product by ID
router.put("/update/:id", async (req, res) => {
  try {
    const { name, description, price, image, stock } = req.body;

    // Validate input
    if (!name || !description || !price || stock === undefined) {
      return res.status(400).json({ error: "All fields are required" });
    }

    let updateData = { name, description, price, stock };

    // If a new image is provided, upload it to Cloudinary
    if (image) {
      if (typeof image !== "string" || !image.startsWith("data:image/")) {
        return res.status(400).json({ error: "Invalid image format. Please provide a valid base64 image." });
      }
      const result = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
      updateData.image = result.secure_url;
    }

    // Find and update the product
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: error.message || "Something went wrong!" });
  }
});

// Delete a product by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: error.message || "Something went wrong!" });
  }
});

// Update product stock
router.put("/update-stock/:id", async (req, res) => {
    try {
      const { quantity } = req.body;
  
      // Validate input
      if (quantity === undefined) {
        return res.status(400).json({ error: "Quantity is required" });
      }
  
      // Find the product
      const product = await Product.findById(req.params.id);
  
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
  
      // Update stock
      product.stock += quantity; // Use `+` to add or subtract stock
      await product.save();
  
      res.status(200).json(product);
    } catch (error) {
      console.error("Error updating product stock:", error);
      res.status(500).json({ error: error.message || "Something went wrong!" });
    }
  });
  

module.exports = router;