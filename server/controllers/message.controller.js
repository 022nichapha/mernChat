const Message = require("../models/message.model");
const User = require("../models/user.model");
const { getReceiverSocketId, io } = require("../lib/socket"); // <--- นำเข้า socket helper

// GET /api/v1/messages/users
const getUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    // หา user ทั้งหมดที่ไม่ใช่ตัวเอง
    const users = await User.find({ _id: { $ne: loggedInUserId } }).select(
      "_id fullName email profilePic",
    );
    res.status(200).json(users);
  } catch (error) {
    console.log("Error in getUsers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/v1/messages/:userId
const getMessages = async (req, res) => {
  try {
    const { userId: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: myId, recipient: userToChatId },
        { sender: userToChatId, recipient: myId },
      ],
    }).sort({ createdAt: 1 });

    // Map ข้อมูลให้ตรงกับ format ที่ Frontend คาดหวัง
    const formattedMessages = messages.map((m) => ({
      _id: m._id,
      text: m.text,
      image: m.file || null,
      senderId: m.sender,
      createdAt: m.createdAt,
    }));

    res.status(200).json(formattedMessages);
  } catch (error) {
    console.log("Error in getMessages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/v1/messages/send/:userId
const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { userId: recipientId } = req.params;
    const senderId = req.user._id;

    // 1. บันทึกลง Database
    const newMsg = new Message({
      sender: senderId,
      recipient: recipientId,
      text: text || null,
      file: image || null, // ตรงนี้เช็คว่าใน model ใช้ชื่อ file หรือ image นะครับ
    });

    await newMsg.save();

    // 2. เตรียมข้อมูลส่งกลับ (Payload)
    const payload = {
      _id: newMsg._id,
      text: newMsg.text,
      image: newMsg.file,
      senderId: newMsg.sender,
      createdAt: newMsg.createdAt,
    };

    // 3. Real-time Logic ผ่าน Socket.io
    const receiverSocketId = getReceiverSocketId(recipientId);

    // ถ้าผู้รับออนไลน์อยู่ (มี Socket ID) ให้ส่งข้อความไปหาแค่คนนั้น
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", payload);
    }

    res.status(201).json(payload);
  } catch (error) {
    console.log("Error in sendMessage:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getUsers,
  getMessages,
  sendMessage,
};
