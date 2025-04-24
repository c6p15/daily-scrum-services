
require("dotenv").config();
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "You need to login first.",
    });
  }

  const token = authHeader.split(" ")[1]; // Extract the token after 'Bearer'

  try {
    const decoded = jwt.verify(token, process.env.jwt_secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Access Denied.",
      error: error.message,
    });
  }
};

module.exports = auth;
