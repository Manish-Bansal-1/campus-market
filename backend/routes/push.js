const express = require("express");
const router = express.Router();
const webpush = require("web-push");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ✅ send public key to frontend
router.get("/public-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// ✅ save subscription
router.post("/subscribe", auth, async (req, res) => {
  try {
    const subscription = req.body;

    if (!subscription?.endpoint) {
      return res.status(400).json({ error: "Invalid subscription" });
    }

    await User.findByIdAndUpdate(req.user.id, {
      pushSubscription: subscription,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
