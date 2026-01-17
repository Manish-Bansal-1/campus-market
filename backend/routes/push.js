const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");

router.post("/subscribe", auth, async (req, res) => {
  try {
    const sub = req.body;

    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return res.status(400).json({ error: "Invalid subscription" });
    }

    await User.findByIdAndUpdate(req.user.id, {
      pushSubscription: {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
      },
    });

    res.json({ success: true, message: "Subscribed for push notifications" });
  } catch (err) {
    console.error("SUBSCRIBE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
