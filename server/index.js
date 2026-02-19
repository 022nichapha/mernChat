const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const userRouter = require("./routers/user.router");
dotenv.config();

const app = express();
const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL;
const MONGODB = process.env.MONGODB;

app.get("/", (req, res) => {
  res.send("Welcome to MERN CHAT SERVER 110");
});
app.use(
  cors({
    origin: [BASE_URL],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/user/", userRouter);
//connect to DB
if (!MONGODB) {
  console.log("No MONGODB URL found in .env");
} else {
  mongoose
    .connect(MONGODB)
    .then(() => {
      console.log("Connect to database successfully");
    })
    .catch((error) => {
      console.log("Mongo DB connection error:", error);
    });
}
app.listen(PORT, () => {
  console.log("Server on http://localhost:" + PORT);
});
