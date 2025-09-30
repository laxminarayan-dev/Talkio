const User = require("../models/User")
const mongoose = require("mongoose")

const loadUsersToCache = async (cache) => {
    try {
        const users = await User.find().select("-password").lean(); // exclude password
        // Cache each user individually
        users.forEach(user => {
            cache.set(`user_${user._id.toString()}`, { ...user });
        });

    } catch (err) {
        console.error("❌ Error loading users to cache:", err);
    }
};

module.exports = loadUsersToCache