const express = require("express");
const route = express.Router()
const userModel = require("../models/User")
const otpModel = require("../models/OTP")
import { Resend } from 'resend';

route.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await userModel.findOne({ username: username })

        if (user == null || user.length === 0) {
            res.status(404).json({
                "message": "no user found"
            })
        }
        else {
            if (password == user.password) {
                res.status(200).json({
                    token: user["_id"],
                    username: user["username"],
                    name: user["name"],
                    "message": "login successfull"
                })
            } else {
                res.status(401).json({
                    "message": "password not match"
                })
            }
        }

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }


})
route.post("/send-otp", async (req, res) => {
    const { email, username } = req.body;

    try {
        // Check if username or email already exists
        const existingUser = await userModel.findOne({
            $or: [
                { username: username },
                { email: email }
            ]
        });

        if (existingUser) {
            let message = "User already exists.";
            if (existingUser.username === username) {
                message = "Username already taken. Please choose a different username.";
            } else if (existingUser.email === email) {
                message = "Email already registered. Please use a different email address.";
            }
            return res.status(409).json({
                message: message
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to database
        const otpDoc = new otpModel({
            email: email,
            otp: otp,
        });
        await otpDoc.save();

        // Set OTP expiration time (e.g., 5 minutes)
        const expirationTime = new Date(Date.now() + 5 * 60 * 1000);
        otpDoc.expiresAt = expirationTime;
        await otpDoc.save();
        // Send OTP via email

        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP for Talkio Registration',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4F46E5;">Welcome to Talkio!</h2>
                    <p>Your OTP for email verification is:</p>
                    <div style="background-color: #F3F4F6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; color: #1F2937; letter-spacing: 8px;">${otp}</span>
                    </div>
                    <p>This OTP will expire in 5 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <br>
                    <p>Best regards,<br>Talkio Team</p>
                </div>
            `
        });

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.error("Send OTP error:", error);
        res.status(500).json({
            message: "Failed to send OTP"
        });
    }
});
route.post("/register", async (req, res) => {
    const { name, username, password, email } = req.body;

    try {
        const existingUser = await userModel.findOne({
            $or: [
                { username: username },
                { email: email }
            ]
        })
        if (existingUser === null) {
            try {
                const user = new userModel({
                    name: name,
                    password: password,
                    username: username,
                    email: email,
                })
                await user.save()
                res.status(200).send({
                    token: user["_id"],
                    username: user["username"],
                    name: user["name"],
                    message: "User Data saved successfully."
                })
            } catch (error) {
                res.status(502).send({
                    message: "Failed to save User Data!"
                })
            }
        } else {
            let message = "User already exists.";
            if (existingUser.username === username) {
                message = "User already exist. Choose different username.";
            } else if (existingUser.email === email) {
                message = "User already exist. Choose different email.";
            }
            res.status(409).send({
                message: message
            })
        }

    } catch (error) {
        res.status(500).send({
            "message": "Internal Server Error"
        })
    }

})
route.post("/verify-otp", async (req, res) => {
    const { email, otp, username, name, password } = req.body;

    try {
        // Find the latest OTP for this email
        const otpDoc = await otpModel.findOne({ email: email }).sort({ createdAt: -1 });

        if (!otpDoc) {
            return res.status(400).json({
                message: "No OTP found. Please request a new OTP."
            });
        }

        // Check if OTP is expired
        if (otpDoc.expiresAt < new Date()) {
            return res.status(400).json({
                message: "OTP has expired. Please request a new OTP."
            });
        }

        // Check if OTP matches
        if (otpDoc.otp !== otp) {
            return res.status(400).json({
                message: "Invalid OTP. Please try again."
            });
        }

        // OTP is valid, proceed with registration
        const existingUser = await userModel.findOne({
            $or: [
                { username: username },
                { email: email }
            ]
        });

        if (existingUser !== null) {
            let message = "User already exists.";
            if (existingUser.username === username) {
                message = "User already exist. Choose different username.";
            } else if (existingUser.email === email) {
                message = "User already exist. Choose different email.";
            }
            return res.status(409).json({
                message: message
            });
        }

        // Create new user
        const user = new userModel({
            name: name,
            password: password,
            username: username,
            email: email,
        });

        await user.save();

        // Delete the used OTP
        await otpModel.deleteMany({ email: email });

        res.status(200).json({
            token: user["_id"],
            username: user["username"],
            name: user["name"],
            message: "Account created successfully."
        });

    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});
module.exports = route
