const express = require("express");
const route = express.Router()
const cache = require("../onStart/cache")
const User = require("../models/User")

route.get("/find", async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.json({ results: [] });
    }

    try {
        const allUserKeys = cache.keys().filter(key => key.startsWith("user_"));
        const allUsers = allUserKeys.map(key => cache.get(key));

        const results = allUsers.filter(user =>
            user.username.toLowerCase().includes(q.toLowerCase())
        );
        res.json({ results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }

})
route.post("/userDetail", async (req, res) => {
    const { userId } = req.body
    try {
        const result = cache.get(`user_${userId}`)
        res.json({ result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})

route.get("/status", async (req, res) => {
    try {
        // Get all cache keys for users
        const allUserKeys = cache.keys().filter((key) => key.startsWith("user_"));

        // Create the status map
        const onlineStatus = {};

        allUserKeys.forEach((key) => {
            const user = cache.get(key); // retrieve user object
            if (user && user._id) {
                // assuming presence means online
                let id = user._id.toString()
                console.log(id);

                onlineStatus[id] = user.isOnline;
            }
        });
        console.log(onlineStatus);

        res.json(onlineStatus);
    } catch (err) {
        console.error("Error fetching online status:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = route
