const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const protectedRoute = async (req, res, next) => {
  console.log("Auth Middleware");

  try {
    // console.log(req.cookies);

    const token = req.cookies.jwt;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No Token provide" });
    }
    const decoded = jwt.verify(token, process.env.SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error while checking token" });
  }
};

const authMiddleware = {
  protectedRoute,
};

module.exports = authMiddleware;
