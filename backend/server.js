require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const itemRoutes = require("./routes/item");
const chatRoutes = require("./routes/chats");

const app = express();
const server = http.createServer(app);

/* =====================
   🌍 ALLOWED ORIGINS
===================== */
const allowedOrigins = [
  "http://localhost:5173",        // local frontend
  "http://localhost:3000",
  process.env.FRONTEND_URL        // vercel frontend (later)
].filter(Boolean);

/* =====================
   🧠 MIDDLEWARE
===================== */
app.use(express.json());

app.use((req, res, next) => {
  console.log("➡️ Incoming request:", req.method, req.originalUrl);
  next();
});

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =====================
   🔌 SOCKET.IO
===================== */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
  });

  socket.on("sendMessage", (data) => {
    io.to(data.chatId).emit("receiveMessage", data);
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
app.use("/api/chats", chatRoutes);


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
