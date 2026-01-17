require("dotenv").config();
console.log("LOG: SERVER IS RUNNING FINAL CHAT VERSION");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const itemRoutes = require("./routes/product");
const chatRoutes = require("./routes/chats");
const adRoutes = require("./routes/ads");
const pushRoutes = require("./routes/push");

const app = express();
const server = http.createServer(app);

/* =====================
   🌍 ALLOWED ORIGINS
===================== */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://campusmarks.vercel.app",
  "https://campusmarket-zeta.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

/* =====================
   🧠 MIDDLEWARE
===================== */
const addItemLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many uploads, try again later." },
});

app.use("/api/items/add", addItemLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

/* =====================
   🔌 SOCKET.IO
===================== */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

app.set("io", io);

/* =====================
   🧠 ONLINE USERS TRACK
===================== */
const onlineUsers = new Map(); // userId -> socketId

io.on("connection", (socket) => {
  console.log("🟢 socket connected:", socket.id);

  // join user room
  socket.on("joinUser", (userId) => {
    if (!userId) return;

    socket.join(userId);
    onlineUsers.set(userId, socket.id);

    io.emit("userOnline", { userId });
  });

  // join chat room
  socket.on("joinChat", ({ chatId, userId }) => {
    if (!chatId) return;

    socket.join(chatId);

    if (userId) {
      socket.to(chatId).emit("userOnline", { chatId, userId });
    }
  });

  // typing
  socket.on("typing", ({ chatId, userId }) => {
    if (!chatId || !userId) return;

    socket.to(chatId).emit("typing", { chatId, userId });
  });

  // send message (live only)
  socket.on("sendMessage", (data) => {
    if (!data?.chatId) return;

    // send to chat room
    io.to(data.chatId).emit("receiveMessage", data);

    // delivered ack
    io.to(data.chatId).emit("deliveredAck", {
      chatId: data.chatId,
      messageTempId: data.messageTempId,
    });
  });

  // seen
  socket.on("seen", ({ chatId, messageTempId, seenBy }) => {
    if (!chatId || !messageTempId) return;

    io.to(chatId).emit("seenAck", { chatId, messageTempId, seenBy });
  });

  socket.on("disconnect", () => {
    console.log("🔴 socket disconnected:", socket.id);

    for (const [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        io.emit("userOffline", { userId });
        break;
      }
    }
  });
});

/* =====================
   🚏 ROUTES
===================== */
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/push", pushRoutes);

app.use(
  "/api/chats",
  (req, res, next) => {
    req.io = io;
    next();
  },
  chatRoutes
);

app.use("/api/ads", adRoutes);

/* =====================
   🗄️ DATABASE
===================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ Mongo Error:", err.message));

/* =====================
   🚀 SERVER START
===================== */
const PORT = process.env.PORT || 5000;

app.get("/api/chats/is-online/:userId", (req, res) => {
  const { userId } = req.params;

  const isOnline = onlineUsers.has(userId);

  res.json({ isOnline });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
