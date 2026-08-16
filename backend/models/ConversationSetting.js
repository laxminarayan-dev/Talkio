const mongoose = require("mongoose");

const conversationSettingSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    participantsKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    backgroundUrl: {
      type: String,
      default: "",
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ConversationSetting", conversationSettingSchema);
