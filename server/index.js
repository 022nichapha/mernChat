const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const userRouter = require("./routers/user.router");

// --- 1. เพิ่มการ Import สำหรับ Socket.io ---
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB = process.env.MONGODB;
const messageRouter = require("./routers/message.router");

// --- 2. สร้าง HTTP Server และตั้งค่า Socket.io ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // URL ของหน้าบ้าน
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ฟังก์ชันจำลองการเก็บรายชื่อ User ที่ออนไลน์
const onlineUsers = new Set();

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    onlineUsers.add(userId);
    console.log(`User connected: ${userId}`);
  }

  // ส่งรายชื่อคนที่ออนไลน์กลับไปให้หน้าบ้าน
  io.emit("getOnlineUsers", Array.from(onlineUsers));

  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    io.emit("getOnlineUsers", Array.from(onlineUsers));
    console.log(`User disconnected: ${userId}`);
  });
});

// --- 3. Middleware เดิมของคุณ ---
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1/messages", messageRouter);

app.get("/", (req, res) => {
  res.send("Welcome to MERN CHAT SERVER 110");
});

app.use("/api/v1/user/", userRouter);

// --- 4. การเชื่อมต่อ Database ---
if (!MONGODB) {
  console.log("No MONGODB URL found in .env");
} else {
  mongoose
    .connect(MONGODB)
    .then(() => console.log("Connect to database successfully"))
    .catch((error) => console.log("Mongo DB connection error:", error));
}

// --- 5. เปลี่ยนจาก app.listen เป็น server.listen (สำคัญมาก!) ---
server.listen(PORT, () => {
  console.log("Server on http://localhost:" + PORT);
});
