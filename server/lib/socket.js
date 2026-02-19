const { Server } = require("socket.io");
const http = require("http");
const express = require("express");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// ฟังก์ชันดึง Socket ID ของผู้รับ (จะใช้ใน message.controller.js)
const getReceiverSocketId = (userId) => {
  return userSocketMap[userId];
};

const userSocketMap = {}; // { userId: socketId }

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  // ป้องกันค่า undefined หรือสตริง "undefined"
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    console.log(`User connected: ${userId} (Socket: ${socket.id})`);
  }

  // ส่งรายชื่อคนออนไลน์ (ส่งเฉพาะ Keys ของ Object)
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId];
      console.log(`User disconnected: ${userId}`);
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// ส่งออก getReceiverSocketId เพื่อให้ Controller เรียกใช้ตอนส่งข้อความ
module.exports = { io, app, server, getReceiverSocketId };
