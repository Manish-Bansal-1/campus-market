require("dotenv").config();
console.log("LOG: SERVER IS RUNNING VERSION 2.0");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const itemRoutes = require("./routes/product");
const chatRoutes = require("./routes/chats");

const app = express();
const server = http.createServer(app);

/* =====================
   🌍 ALLOWED ORIGINS
===================== */
const allowedOrigins = [
  "http://localhost:5173",        // local frontend
  "http://localhost:3000",
  "https://campusmarks.vercel.app",
  "https://campusmarket-zeta.vercel.app",
  process.env.FRONTEND_URL        // vercel frontend (later)
].filter(Boolean);

/* =====================
   🧠 MIDDLEWARE
===================== */

const addItemLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20, // 15 min me max 20 items
  message: { error: "Too many uploads, try again later." },
});

app.use("/api/items/add", addItemLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log("➡️ Incoming request:", req.method, req.originalUrl);
  next();
});

app.use(
  cors({
    origin: allowedOrigins, // ✅ allow all origins (for now)
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

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);
  socket.on("joinUser", (userId) => {
    socket.join(userId);
  });

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
  });

  socket.on("sendMessage", (data) => {
  // message live in chat room
  io.to(data.chatId).emit("receiveMessage", data);

  // 🔔 navbar unread count update (global)
  io.emit("unreadUpdate", {
    chatId: data.chatId,
    sender: data.sender,
  });
});


  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});


/* =====================
   🚏 ROUTES
===================== */
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/chats", (req, res, next) => {
  req.io = io; // ✅ io available in routes
  next();
}, chatRoutes);



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

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
