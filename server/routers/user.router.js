const express = require("express");
const { registerUser, loginUser } = require("../controllers/userController");

const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/me", protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;
