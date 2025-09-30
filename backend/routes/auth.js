const express = require("express");
const route = express.Router()
const userModel = require("../models/User")

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
route.post("/register", async (req, res) => {
    const { name, username, password } = req.body;

    try {
        const user = await userModel.findOne({ username: username })
        if (user === null) {
            try {
                const user = new userModel({
                    name: name,
                    password: password,
                    username: username,
                })
                await user.save()
                res.status(200).send({
                    token: user["_id"],
                    username: user["username"],
                    name: user["name"],
                    message: "User Data saved successfully"
                })
            } catch (error) {
                res.status(500).send({
                    message: "Failed to save User Data "
                })
            }
        } else {
            res.status(401).send({
                "message": "user already exist"
            })
        }

    } catch (error) {
        res.status(500).send({
            "message": "Internal Server Error"
        })
    }

})
module.exports = route
