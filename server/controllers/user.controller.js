const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const dotenv = require("dotenv");
dotenv.config();
const secret = process.env.SECRET;
const node_mode = process.env.node_mode;
const cloudinary = require("../configs/cloudinary");

const register = async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });
    //save login in cookies
    if (newUser) {
      const token = jwt.sign({ userId: newUser._id }, secret, {
        expiresIn: "1d",
      });

      res.cookie("jwt", token, {
        maxAge: 24 * 60 * 60 * 1000, //MS
        httpOnly: true, //XSS Attacks
        sameSite: "strict", //CSRF attacks,
        secure: node_mode === "production",
      });

      console.log("Token generated and cookie set");

      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        token: token,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log(error);

    res
      .status(500)
      .json({ message: "Internal Server Error While registering a new user" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email or Password is missing" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email not Found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Password is mismatched" });
    }

    const token = jwt.sign({ userId: user._id }, secret, {
      expiresIn: "1d",
    });

    res.cookie("jwt", token, {
      maxAge: 24 * 60 * 60 * 1000, //MS
      httpOnly: true, //XSS Attacks
      sameSite: "strict", //CSRF attacks,
      secure: node_mode === "production",
    });

    console.log("Token generated ans cookie set");

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      token: token,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Internal Server Error While logging in" });
  }
};

const logOut = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.send({ message: "Logged Out successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error while logging out" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, profilePic } = req.body;

    // console.log(profilePic, fullName);

    const userId = req.user._id;
    if (fullName && profilePic) {
      //upload pic to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      if (!uploadResponse) {
        res
          .status(500)
          .json({ message: "Error while uploading profile picture" });
      }
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          fullName: fullName,
          profilePic: uploadResponse.secure_url,
        },
        { new: true }
      );
      if (!updatedUser) {
        res.status(500).json({ message: "Error while update user profile" });
      }
      res.status(200).json({ message: "User profile updated successfully" });
    } else if (profilePic) {
      //upload pic to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      if (!updateProfile) {
        res
          .status(500)
          .json({ message: "Error while uploading profile picture" });
      }
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          profilePic: uploadResponse.secure_url,
        },
        { new: true }
      );
      if (!updatedUser) {
        res.status(500).json({ message: "Error while update user profile" });
      }
      res.status(200).json({ message: "User profile updated successfully" });
    } else if (fullName) {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          fullName: fullName,
        },
        { new: true }
      );
      if (!updatedUser) {
        res.status(500).json({ message: "Error while updating user profile" });
      }
      res.status(200).json({ message: "User profile updated successfully" });
    } else {
      res.status(200).json({ message: "Nothing is updated" });
    }
  } catch (error) {
    console.log(error);

    res
      .status(500)
      .json({ message: "Internal Server Error while updating user profile" });
  }
};

const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const userController = {
  register,
  login,
  logOut,
  updateProfile,
  checkAuth,
};

module.exports = userController;
