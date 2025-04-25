require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken')
const path = require('path');

const app = express();

const cors = require("cors");

const Port = process.env.port;
const fPort = process.env.frontend_port;
const Host = process.env.host || "localhost";
const fHost = process.env.frontend_host || "localhost";

app.use(
  cors({
    origin: `http://${fHost}:${fPort}`,
    credentials: true, // allow cookies
  })
);
app.use(cookieParser());
app.use(express.json());
app.use('/api/files', express.static(path.join(__dirname, '../uploads')));
app.use(express.urlencoded({ extended: true }));


const session = require("express-session");
const passport = require("../services/passport.service.js");

app.use(
  session({
    secret: process.env.jwt_secret,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const token = jwt.sign(
      {
        id: req.user._id,
        email: req.user.email,
      },
      process.env.jwt_secret,
      { expiresIn: "30d" }
    );

    res.redirect(`http://${fHost}:${fPort}/login-success?token=${token}`);
  }
);

const userRoutes = require("../routers/user.routes.js");
const dailyScrumRoutes = require('../routers/daily-scrum.routes.js')
const titleRoutes = require('../routers/title.routes.js')

app.use("/api/user", userRoutes);
app.use('/api/daily-scrum', dailyScrumRoutes)
app.use('/api/title', titleRoutes)

const connectDB = require("../config/db");

connectDB().then(() => {
  app.listen(Port, "0.0.0.0", () => {
    console.log(`Server is running on port http://${Host}:${Port}`);
  });
});
