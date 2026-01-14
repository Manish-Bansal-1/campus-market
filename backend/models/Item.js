const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    category: { type: String },

    // ✅ NEW (optional)
    whatsappNumber: { type: String, default: "" },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isSold: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", ItemSchema);
