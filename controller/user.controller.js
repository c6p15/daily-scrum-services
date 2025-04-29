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
        return res.status(400).json({
          msg: "Username already exists" 
        });
      }
      if (existing.email === email) {
        return res.status(400).json({
          msg: "Email already exists"
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: passwordHash,
    });

    res.status(200).json({
      msg: "Registration completed!!",
      status: 200,
      info: {
        username: newUser.username,
        email: newUser.email
      },
    });
  } catch (error) {
    res.status(500).json({
      msg: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const userResult = await User.findOne({ username });
    if (!userResult) {
      return res.status(404).json({
        msg: "User not found"
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, userResult.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        msg: "Invalid password"
      });
    }

    const token = jwt.sign({
      id: userResult._id,
      username: userResult.username 
    }, process.env.jwt_secret, {
      expiresIn: "30d",
    });
        
    res.status(200).json({
      msg: "Login complete!",
      status: 200,
      token: token, // Return token directly
    });
  } catch (error) {
    res.status(500).json({
      msg: error.message
    });
  }
};

const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({
        msg: "No token found. Already logged out or not logged in."
      });
    }

    // Just send success, the client should remove the token
    return res.status(200).json({
      msg: "Logout completed!!",
      status: 200
    });

  } catch (error) {
    return res.status(500).json({
      msg: "Logout failed...",
      error: error.message,
    });
  }
};


const getInfo = async (req, res) => {
  const user = await User.findById(req.user.id); // still fetch DB data if needed

  if (!user) {
    return res.status(404).json({
      msg: "User not found"
    });
  }

  res.status(200).json({
    msg: "fetch user's info completed!!",
    status: 200,
    info: {
      id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic || null , // <-- this comes from session, not DB
    },
  });
};

module.exports = {
  register,
  login,
  logout,
  getInfo,
};
