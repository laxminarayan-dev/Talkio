const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
        },
        otp: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            index: { expires: 0 }, // TTL index
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("OTP", otpSchema, "OTPs");