
const mongoose = require('mongoose')

const TitleSchema = mongoose.Schema(
    {
        title_name: {
            type: String
        }
    }
)

const Title = mongoose.model('Title', TitleSchema)

module.exports = Title