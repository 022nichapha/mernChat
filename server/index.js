const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

dotenv.config();

// ===== App =====
const app = express();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL;
const MONGODB = process.env.MONGODB;

// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: BASE_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "access-token"],
  }),
);

// ===== Test Route =====
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ===== Routes =====
app.use("/api/users", require("./routers/user.router"));

// ===== Connect MongoDB =====
if (!MONGODB) {
  console.log("No MONGODB URL found");
} else {
  mongoose
    .connect(MONGODB)
    .then(() => console.log("Connect to database successfully"))
    .catch((error) => console.log("MongoDB connection error:", error));
}

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
