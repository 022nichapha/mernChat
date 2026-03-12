const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  // การอนุญาติให้ติดต่อกับส่วนของหน้าบ้าน
  cors: {
    origin: [process.env.BASE_URL || "http://localhost:5173"],
  },
});

const userSocketMap = {}; // {userId: socketId}

// return socketId

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId; // socket.handshake คือการส่งคำร้องขอ query คือการส่งข้อมูลร้องข้อ
  console.log("ฉันกำลังอนนไลน์อยู่", socket.id)

  if (userId) userSocketMap[userId] = socket.id;

  console.log("UserSocketMap", userSocketMap)

  // emits the online users to the client
  // userCoketMap คือส่งออกไปหรือ reture user ที่ออนไลอยู่บ้าง  
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // can be used to listen to the events from the client
  socket.on("disconnect", () => {

    console.log("A user disconnected", socket.id)

    if (userId) delete userSocketMap[userId];

    console.log("UserSocketMap", userSocketMap);

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

module.exports = { io, app, server, getReceiverSocketId };
