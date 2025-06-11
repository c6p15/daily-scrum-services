
const mongoose = require('mongoose')

const TitleSchema = mongoose.Schema(
    {
        title: {
            type: String
        },
        member: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'User',
            default: []
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            require: true
        }
    },
    {
        timestamps: true
    }
)

const Title = mongoose.model('Title', TitleSchema)

module.exports = Title