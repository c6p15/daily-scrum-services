require('dotenv').config()

const mongoose = require('mongoose')

// testing database
const mongodb_username = process.env.mongoDB_username
const mongodb_password = process.env.mongoDB_password
const mongodb_cluster = process.env.mongoDB_cluster
const mongodb_database = process.env.mongodb_database

const mongodbUri = `mongodb+srv://${mongodb_username}:${mongodb_password}@${mongodb_cluster}/${mongodb_database}?retryWrites=true&w=majority&appName=Cluster0`

const connectDB = async () => {
    try {
        await mongoose.connect( mongodbUri,{
            useNewUrlParser: true,
            useUnifiedTopology: true
          }
        )
        console.log('Connected to database.')
    } catch (error) {
        console.error('Database connection failed:', error.message)
        process.exit(1); 
    }
}

module.exports = connectDB