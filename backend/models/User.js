const mongoose = require("mongoose");

const PushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String,
    },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 20,
    },

    year: {
      type: String,
      enum: ["", "1st", "2nd", "3rd", "4th"],
      default: "",
    },

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

    // ✅ push notifications
    pushSubscription: {
      type: PushSubscriptionSchema,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
