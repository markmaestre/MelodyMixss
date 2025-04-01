const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  image: { type: String, default: "" },
  pushToken: { type: String, default: "" },
  role: { type: String, default: "user" }, 
});

module.exports = mongoose.model("User", userSchema);
