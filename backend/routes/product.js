const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const { sendPushToAllUsers } = require("../utils/sendPush");

// 1️⃣ CREATE ITEM
router.post("/add", auth, upload.single("image"), async (req, res) => {
  try {
    console.log("✅ REQ BODY:", req.body);
    console.log("✅ REQ FILE:", req.file ? "YES" : "NO");

    let imageUrl = "";

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    // ✅ WhatsApp number optional (cleaned)
    let whatsappNumber = req.body.whatsappNumber || "";
    whatsappNumber = whatsappNumber
      .toString()
      .replace(/\s+/g, "")
      .replace("+", "");

    const newItem = new Item({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: imageUrl,
      seller: req.user.id,
      whatsappNumber: whatsappNumber,
    });

    const savedItem = await newItem.save();

    console.log("✅ SAVED ITEM:", savedItem);

await sendPushToAllUsers({
  title: "🆕 New Listing Added",
  body: `${savedItem.title} for ₹${savedItem.price}`,
  url: "/",
});

    res.status(201).json(savedItem);
  } catch (err) {
    console.log("❌ Add item error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2️⃣ GET ALL ITEMS
router.get("/all", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const query = { isSold: false };

    const total = await Item.countDocuments(query);

    const items = await Item.find(query)
      // ✅ FIX: now send seller name + username + year + gender
      .populate("seller", "name username year gender _id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3️⃣ DELETE ITEM
router.delete("/:id", auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) return res.status(404).json("Item not found");

    if (item.seller.toString() !== req.user.id) {
      return res.status(401).json("You can only delete your own items!");
    }

    await item.deleteOne();
    res.status(200).json("Item deleted successfully");
  } catch (err) {
    res.status(500).json(err);
  }
});

// 4️⃣ GET MY LISTINGS (SELLER)
router.get("/my", auth, async (req, res) => {
  try {
    const items = await Item.find({ seller: req.user.id });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5️⃣ MARK ITEM AS SOLD
router.put("/sold/:id", auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) return res.status(404).json("Item not found");

    if (item.seller.toString() !== req.user.id) {
      return res.status(401).json("Not authorized");
    }

    item.isSold = true;
    await item.save();
    await sendPushToAllUsers({
  title: "✅ Item Sold",
  body: `${item.title} has been marked as SOLD`,
  url: "/",
});


    res.status(200).json("Item marked as sold");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6️⃣ UPDATE ITEM (EDIT LISTING)
router.put("/update/:id", auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) return res.status(404).json({ error: "Item not found" });

    // only owner can edit
    if (item.seller.toString() !== req.user.id) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const { title, price, description, whatsappNumber } = req.body;

    if (title !== undefined) item.title = title;
    if (price !== undefined) item.price = price;
    if (description !== undefined) item.description = description;

    if (whatsappNumber !== undefined) {
      item.whatsappNumber = whatsappNumber
        .toString()
        .replace(/\s+/g, "")
        .replace("+", "");
    }

    await item.save();

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
