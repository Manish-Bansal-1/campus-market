const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // ✅ Name (NOT unique)
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
    },

    // ✅ Username (unique login)
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 20,
    },

    // ✅ Optional Year
    year: {
      type: String,
      enum: ["", "1st", "2nd", "3rd", "4th"],
      default: "",
    },

    // ✅ Optional Gender
    gender: {
      type: String,
      enum: ["", "male", "female", "not_preferred"],
      default: "",
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
