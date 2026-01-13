console.log("✅ item routes file loaded");

const express = require('express');
const router = express.Router();
const multer = require('multer');
const Item = require('../models/Item');
const auth = require('../middleware/authMiddleware');
const path = require("path");

// Configure how images are saved
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// CREATE ITEM
// Inside backend/routes/Item.js

// 1. Update Create Route
router.post('/add', auth, upload.single('image'), async (req, res) => {
  try {
    console.log("BODY =>", req.body);
    console.log("FILE =>", req.file);

    const newItem = new Item({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: req.file ? req.file.filename : "",
      seller: req.user.id,
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 2.Get All Route

router.get('/all', async (req, res) => {
  try {
    // 💡 FIX: Change 'sold' to 'isSold' to match your MongoDB screenshot
    // 💡 FIX: Ensure we populate 'seller' to give the frontend the ID
    const items = await Item.find({ isSold: false }).populate('seller', 'name _id');
    
    console.log("Items found:", items.length); // This helps you debug in terminal
    res.status(200).json(items);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE ITEM
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) return res.status(404).json("Item not found");

    // Safety check: Only the owner can delete
    if (item.seller.toString() !== req.user.id) {
      return res.status(401).json("You can only delete your own items!");
    }

    await item.deleteOne();
    res.status(200).json("Item deleted successfully");
  } catch (err) {
    res.status(500).json(err);
  }
});

// 🔹 GET MY LISTINGS (SELLER)
router.get('/my', auth, async (req, res) => {
  try {
    const items = await Item.find({ seller: req.user.id });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 MARK ITEM AS SOLD
router.put('/sold/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) return res.status(404).json("Item not found");

    if (item.seller.toString() !== req.user.id) {
      return res.status(401).json("Not authorized");
    }

    item.isSold = true;
    await item.save();

    res.status(200).json("Item marked as sold");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;