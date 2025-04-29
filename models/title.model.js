
const mongoose = require('mongoose')

const TitleSchema = mongoose.Schema(
    {
        title_name: {
            type: String
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            require: true
        }
    }
)

const Title = mongoose.model('Title', TitleSchema)

module.exports = Title