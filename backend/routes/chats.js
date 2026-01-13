const express = require("express");
const router = express.Router();
const Chat = require("../models/chat");
const auth = require("../middleware/authMiddleware");

/* 1️⃣ Create or Get Chat */
router.post("/init", auth, async (req, res) => {
  const { itemId, sellerId } = req.body;
  const buyerId = req.user.id;

  let chat = await Chat.findOne({
    item: itemId,
    buyer: buyerId,
    seller: sellerId,
  });

  if (!chat) {
    chat = await Chat.create({
      item: itemId,
      buyer: buyerId,
      seller: sellerId,
      messages: [],
      unreadCount: 0,

      // ✅ soft delete flags
      deletedByBuyer: false,
      deletedBySeller: false,
    });
  }

  res.json(chat);
});

/* 2️⃣ Single Chat */
router.get("/single/:chatId", auth, async (req, res) => {
  const chat = await Chat.findById(req.params.chatId)
    .populate("buyer seller", "name")
    .populate("item", "title");

  // ✅ Reset unread when chat opened
  chat.unreadCount = 0;
  await chat.save();

  // ✅ Emit live update so Navbar/Inbox becomes 0 instantly
  if (req.io) {
    req.io.emit("unreadUpdate", {
      chatId: chat._id.toString(),
    });
  }

  res.json(chat);
});

/* 3️⃣ Send Message */
router.post("/message", auth, async (req, res) => {
  const { chatId, text } = req.body;
  const chat = await Chat.findById(chatId);

  chat.messages.push({ sender: req.user.id, text });

  // unread logic
  if (req.user.id.toString() !== chat.seller.toString()) {
    chat.unreadCount += 1;
  }

  // 🔥 IMPORTANT: new message aaya toh chat "unhide" bhi ho jaye
  chat.deletedByBuyer = false;
  chat.deletedBySeller = false;

  await chat.save();

  // ✅ LIVE event for Navbar + Inbox
  if (req.io) {
    req.io.emit("unreadUpdate", {
      chatId,
    });
  }

  res.json(chat);
});

/* 4️⃣ My Chats (hide deleted chats) */
router.get("/my-chats", auth, async (req, res) => {
  const userId = req.user.id.toString();

  const chats = await Chat.find({
    $expr: {
      $or: [
        {
          $and: [
            { $eq: [{ $toString: "$buyer" }, userId] },
            { $ne: ["$deletedByBuyer", true] },
          ],
        },
        {
          $and: [
            { $eq: [{ $toString: "$seller" }, userId] },
            { $ne: ["$deletedBySeller", true] },
          ],
        },
      ],
    },
  })
    .populate("buyer", "name")
    .populate("seller", "name")
    .populate("item", "title")
    .sort({ updatedAt: -1 });

  res.json(chats);
});

/* 5️⃣ Unread Count (ignore deleted chats for seller) */
router.get("/unread-count", auth, async (req, res) => {
  const userId = req.user.id.toString();

  const chats = await Chat.find({
    $expr: {
      $and: [
        { $eq: [{ $toString: "$seller" }, userId] },
        { $ne: ["$deletedBySeller", true] },
      ],
    },
  });

  let unreadCount = 0;
  chats.forEach((c) => (unreadCount += c.unreadCount || 0));

  res.json({ unreadCount });
});

/* 6️⃣ Soft Delete Chat (DB me delete nahi hoga) */
router.delete("/:chatId", auth, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const userId = req.user.id.toString();

    const isBuyer = chat.buyer.toString() === userId;
    const isSeller = chat.seller.toString() === userId;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: "Not allowed" });
    }

    // ✅ hide only
    if (isBuyer) chat.deletedByBuyer = true;
    if (isSeller) chat.deletedBySeller = true;

    await chat.save();

    // ✅ LIVE UPDATE for Navbar + Inbox
    if (req.io) {
      req.io.emit("unreadUpdate", { chatId });
    }

    res.json({ message: "Chat removed from your inbox" });
  } catch (err) {
    console.error("DELETE CHAT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
