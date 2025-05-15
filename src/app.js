require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken')
const path = require('path');
const storage = require('../services/storage.service.js')

const app = express();

const cors = require("cors");

const Port = process.env.port;
const Host = process.env.host || "localhost";

app.use(
  cors({
    origin: process.env.frontend_url,
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
        username: req.user.username
      },
      process.env.jwt_secret,
      { expiresIn: "30d" }
    );

    res.redirect(`${process.env.frontend_url}/login-success?token=${token}`);
  }
);

app.get('/api/files/:filename', async (req, res) => {
  try {
      const filename = req.params.filename
      const storageDriver = process.env.STORAGE_DRIVER || (process.env.NODE_ENV === 'development' ? 'local' : 's3')
      
      if (storageDriver === 's3') {
          // For S3 storage, redirect to the signed URL
          const signedUrl = await storage.getObjectSignedUrl(filename)
          return res.redirect(signedUrl)
      } else {
          // For local storage, serve the file directly
          const storagePath = process.env.STORAGE_PATH || './uploads'
          const absoluteStoragePath = path.resolve(storagePath)
          const filePath = path.join(absoluteStoragePath, filename)
          return res.sendFile(filePath)
      }
  } catch (error) {
      console.error(`Error serving file: ${error.message}`)
      return res.status(404).json({ message: 'File not found' })
  }
})


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
