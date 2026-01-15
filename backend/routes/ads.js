const express = require("express");
const router = express.Router();
const Ad = require("../models/Ad");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

// ✅ GET ALL ADS (public)
router.get("/", async (req, res) => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ CREATE AD (ADMIN ONLY)
router.post("/", auth, admin, async (req, res) => {
  try {
    const { title, description, link } = req.body;

    if (!title || !link) {
      return res.status(400).json({ message: "Title & link required" });
    }

    const newAd = new Ad({
      title,
      description,
      link,
      createdBy: req.user.id,
    });

    const saved = await newAd.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ DELETE AD (ADMIN ONLY)
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    await ad.deleteOne();
    res.json({ message: "Ad deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
