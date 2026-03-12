const Message = require("../models/message.model");
const User = require("../models/user.model");
const cloudinary = require("../configs/cloudinary.js");
const { getReceiverSocketId, io } = require("../lib/socket.js");

exports.getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        // $ne ดึงรายชื่อ user ทั้งหมด ยกเว้นตัวเอง และไม่ส่ง password กลับมา —password ใช้สำหรับแสดง sidebar รายชื่อคนที่แชทด้วย
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        const usersWithDetails = await Promise.all(
            filteredUsers.map(async (user) => {
                const latestMessage = await Message.findOne({
                    $or: [
                        { senderId: loggedInUserId, receiverId: user._id },
                        { senderId: user._id, receiverId: loggedInUserId },
                    ],
                }).sort({ createdAt: -1 });

                const unreadCount = await Message.countDocuments({
                    senderId: user._id,
                    receiverId: loggedInUserId,
                    isRead: false,
                });

                return {
                    ...user._doc,
                    latestMessage,
                    unreadCount,
                };
            })
        );

        // Sort users by latest message (descending)
        usersWithDetails.sort((a, b) => {
            const timeA = a.latestMessage ? new Date(a.latestMessage.createdAt).getTime() : 0;
            const timeB = b.latestMessage ? new Date(b.latestMessage.createdAt).getTime() : 0;
            return timeB - timeA;
        });

        res.status(200).json(usersWithDetails);
    } catch (error) {
        console.error("Error in getUsersForSidebar: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        });

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getMessages: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            // Upload base64 image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save();

        // realtime functionality => socket.io
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        const senderSocketId = getReceiverSocketId(senderId);
        if (senderSocketId && receiverSocketId !== senderSocketId) {
            io.to(senderSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error in sendMessage: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.markMessagesAsRead = async (req, res) => {
    try {
        const { id: senderId } = req.params;
        const myId = req.user._id;

        await Message.updateMany(
            { senderId: senderId, receiverId: myId, isRead: false },
            { $set: { isRead: true } }
        );

        const senderSocketId = getReceiverSocketId(senderId);
        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesRead", { readerId: myId });
        }

        res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        console.error("Error in markMessagesAsRead: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
