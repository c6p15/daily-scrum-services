require("dotenv").config();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model.js");

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existing) {
      if (existing.username === username) {
        return res.status(400).json({ message: "Username already exists" });
      }
      if (existing.email === email) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: passwordHash,
    });

    res.status(200).json({
      message: "Registration complete",
      username: newUser.username,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const userResult = await User.findOne({ username });
    if (!userResult) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, userResult.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: userResult._id }, process.env.jwt_secret, {
      expiresIn: "30d",
    });
        
    res.status(200).json({
      message: "Login complete!",
      token: token, // Return token directly
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logout = (req, res) => {
  try {
    // With JWT, logout on client side just means forgetting the token
    res.status(200).json({ message: "Logout complete! Please discard your token on the client side." });
  } catch (error) {
    res.status(500).json({
      message: "Logout failed...",
      error: error.message,
    });
  }
};

const getInfo = async (req, res) => {
  const user = await User.findById(req.user.id); // still fetch DB data if needed

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({
    message: "Authenticated",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      profilePic: req.user.profilePic || null , // <-- this comes from session, not DB
    },
  });
};

module.exports = {
  register,
  login,
  logout,
  getInfo,
};
