
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
        }
    }
)

const User = mongoose.model('User', UserSchema)

module.exports = User