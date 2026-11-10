const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text: {
        type: String,
        trim: true,
        default: ""
    },
    image: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
