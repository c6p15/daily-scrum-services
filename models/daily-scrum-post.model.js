
const mongoose = require('mongoose')

const DailyScrumPostSchema = mongoose.Schema(
    {
        title: {
            type: String
        },
        daily: {
            type: String,
        },
        problem: {
            type: String,
        },
        todo: {
            type: String,
        },
        properties: {
            type: String,
        },
        files: {
            type: [String],
            default: []
        },
        review: [
            {
                review_text: {type: String},
                score: {type: String},
                reviewer: {type: String}
            },
            { timestamps: true }
        ],
        writer: {
            type: String
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

const DailyScrumPost = mongoose.model('DailyScrumPost', DailyScrumPostSchema)

module.exports = DailyScrumPost