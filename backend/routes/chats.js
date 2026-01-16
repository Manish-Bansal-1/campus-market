const express = require("express");
const router = express.Router();
const Chat = require("../models/chat");
const auth = require("../middleware/authMiddleware");

/* =========================
   1) CREATE / GET CHAT
========================= */
router.post("/init", auth, async (req, res) => {
  try {
    const { itemId, sellerId } = req.body;
    const buyerId = req.user.id;

    if (!itemId || !sellerId) {
      return res.status(400).json({ message: "itemId and sellerId required" });
    }

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
        deletedByBuyer: false,
        deletedBySeller: false,
      });
    }

    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   2) GET SINGLE CHAT
   (Reset unread for opener)
========================= */
router.get("/single/:chatId", auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate("buyer seller", "name username")
      .populate("item", "title");

    if (!chat) return res.status(404).json({ error: "Chat not found" });

    // reset unread when opened
    chat.unreadCount = 0;
    await chat.save();

    // notify this user only (navbar refresh)
    if (req.io) {
      req.io.to(req.user.id).emit("unreadUpdate", {
        chatId: chat._id.toString(),
        action: "reset",
      });
    }

    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   3) SEND MESSAGE (DB)
========================= */
router.post("/message", auth, async (req, res) => {
  try {
    const { chatId, text } = req.body;

    if (!chatId || !text?.trim()) {
      return res.status(400).json({ message: "chatId and text required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    chat.messages.push({ sender: req.user.id, text: text.trim() });

    const senderId = req.user.id.toString();

    const receiverId =
      senderId === chat.buyer.toString()
        ? chat.seller.toString()
        : chat.buyer.toString();

    // increment unread ONLY for receiver
    chat.unreadCount = (chat.unreadCount || 0) + 1;

    // unhide chat on new msg
    chat.deletedByBuyer = false;
    chat.deletedBySeller = false;

    await chat.save();

    // 🔥 notify receiver for unread count
    if (req.io) {
      req.io.to(receiverId).emit("unreadUpdate", {
        chatId: chat._id.toString(),
        action: "increment",
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   4) MY CHATS
========================= */
router.get("/my-chats", auth, async (req, res) => {
  try {
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
      .populate("buyer seller", "name username")
      .populate("item", "title")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   5) UNREAD COUNT (Navbar)
========================= */
router.get("/unread-count", auth, async (req, res) => {
  try {
    const userId = req.user.id.toString();

    // count only chats where user is seller OR buyer?
    // simple: count for all chats where user is participant
    const chats = await Chat.find({
      $expr: {
        $or: [
          { $eq: [{ $toString: "$buyer" }, userId] },
          { $eq: [{ $toString: "$seller" }, userId] },
        ],
      },
    });

    let unreadCount = 0;
    chats.forEach((c) => (unreadCount += c.unreadCount || 0));

    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   6) SOFT DELETE CHAT
========================= */
router.delete("/:chatId", auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id.toString();

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const isBuyer = chat.buyer.toString() === userId;
    const isSeller = chat.seller.toString() === userId;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: "Not allowed" });
    }

    if (isBuyer) chat.deletedByBuyer = true;
    if (isSeller) chat.deletedBySeller = true;

    await chat.save();

    if (req.io) {
      req.io.to(userId).emit("unreadUpdate", { chatId, action: "delete" });
    }

    res.json({ message: "Chat removed from your inbox" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
