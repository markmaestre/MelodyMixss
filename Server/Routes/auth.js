const express = require("express");
const User = require("../Models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const upload = require("../utils/cloudinary");

const router = express.Router();


router.post("/register", upload.single("image"), async (req, res) => {
  const { name, email, password, dob, gender, phone, address } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      dob,
      gender,
      phone,
      address,
      image: req.file ? req.file.path : "",
    });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post("/login", async (req, res) => {
    const { email, password, pushToken } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: "User not found" });
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
  
     
      if (pushToken && pushToken !== user.pushToken) {
        user.pushToken = pushToken;
        await user.save();
      }
  
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      
      res.status(200).json({ token, user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  


router.post("/savetoken", async (req, res) => {
  const { userId, token } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { pushToken: token },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "Push token saved successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/profile/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, email, currentPassword, newPassword, dob, gender, phone, address } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

   
    if (name) user.name = name;
    if (email) user.email = email;
    if (dob) user.dob = dob;
    if (gender) user.gender = gender;
    if (phone) user.phone = phone;
    if (address) user.address = address;
   
    if (req.file) {
      user.image = req.file.path;
    }


    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

  
    const userToReturn = user.toObject();
    delete userToReturn.password;

    res.status(200).json({ 
      message: "Profile updated successfully",
      user: userToReturn
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;