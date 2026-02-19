const express = require("express");
const router = express.Router();
const { protectedRoute } = require("../middlewares/auth.middleware");

const {
  getUsers,
  getMessages,
  sendMessage,
} = require("../controllers/message.controller"); // ลบตัว s ออกให้ตรงกับชื่อไฟล์จริง

router.get("/users", protectedRoute, getUsers);
router.get("/:userId", protectedRoute, getMessages);
router.post("/send/:userId", protectedRoute, sendMessage);

module.exports = router;
