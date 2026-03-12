const express = require("express");
const { getUsersForSidebar, getMessages, sendMessage, markMessagesAsRead } = require("../controllers/message.controller.js");
const { protectedRoute } = require("../middlewares/auth.middleware.js");

const router = express.Router();

router.get("/users", protectedRoute, getUsersForSidebar);
router.get("/:id", protectedRoute, getMessages);

router.post("/send/:id", protectedRoute, sendMessage);
router.put("/mark-read/:id", protectedRoute, markMessagesAsRead);

module.exports = router;
