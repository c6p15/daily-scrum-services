
const mongoose = require('mongoose')

const UserSchema = mongoose.Schema(
    {
        username: {
            type: String,
            maxlength: 255
        },
        email: {
            type: String,
            maxlength: 255
        },
        password: {
            type: String, 
            maxlength: 255
        },
        profilePic: {
            type: String,
        }
    }
)

const User = mongoose.model('User', UserSchema)

module.exports = User