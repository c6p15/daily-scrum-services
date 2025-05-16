require('dotenv').config()

const mongoose = require('mongoose')

const {
  mongoDB_username,
  mongoDB_password,
  mongoDB_cluster,
  mongodb_database
} = process.env;

const mongodbUri = `mongodb+srv://${mongoDB_username}:${mongoDB_password}@${mongoDB_cluster}/${mongodb_database}?retryWrites=true&w=majority&appName=Cluster0`;

const connectDB = async () => {
  try {
    await mongoose.connect(mongodbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, 
      serverSelectionTimeoutMS: 5000, 
      socketTimeoutMS: 45000 
    });
    console.log('✅ Connected to MongoDB.');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
