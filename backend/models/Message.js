const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        senderName: {
            type: String,  // Full name (optional)
            required: true,
        },

        senderUsername: {
            type: String,  // Username (optional)
            required: true,
        },

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        receiverName: {
            type: String,  // Full name (optional)
            required: true,
        },

        receiverUsername: {
            type: String,  // Username (optional)
            required: true,
        },

        content: {
            type: String,
            required: true,
            trim: true,
        },

        isSeen: {
            type: Boolean,
            default: false,
        },

        seenAt: {
            type: Date,
            default: null,
        },

        type: {
            type: String,
            enum: ["text", "image", "file"],
            default: "text",
        },
        // ✅ New Fields for Reply Feature
        replyMessage: {
            type: String,
            default: null, // The text/content being replied to
        },
        replyMessageSender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null, // Sender ID of the original message
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);

module.exports = mongoose.model("Message", messageSchema);

const Message = mongoose.model("Message", messageSchema, "Messages");

module.exports = Message;
