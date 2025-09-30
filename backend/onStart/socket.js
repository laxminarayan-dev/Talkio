const { Server } = require("socket.io");
const start_socket_server = (server, cache) => {
    const Message = require("../models/Message")
    const io = new Server(server, {
        cors: {
            origin: "http://192.168.29.98:5173", // your React app URL
            methods: ["GET", "POST"],
        },
        pingInterval: 3000, // 10 seconds
        pingTimeout: 3000,   // 2.5 seconds
    });

    const connectedUsers = new Map(); // Maps socket.id to user info

    // Middleware to authenticate and assign user info from handshake auth
    io.use((socket, next) => {
        const { userId, username } = socket.handshake.auth;
        if (!userId || !username) {
            return next(new Error("invalid user data"));
        }
        socket.userId = userId;
        socket.username = username;
        next();
    });

    console.log("socket is started")
    io.on("connection", (socket) => {
        // Add this new user connection to our map
        // connectedUsers.set(socket.id, { userId: socket.userId, username: socket.username });
        connectedUsers.set(socket.userId, socket)

        // Update cache: mark this user as online
        const user = cache.get(`user_${socket.userId}`)
        cache.set(`user_${user._id.toString()}`, { ...user, isOnline: true });

        // Tell others this user just came online
        socket.broadcast.emit("someone-online", {
            userId: socket.userId,
            username: socket.username,
        });
        console.log(`✅ User connected: (${socket.username}) ${socket.id}`);

        // Send private message
        socket.on("send-message", ({ to, toStatus, message, from, fromStatus }) => {
            let receiverSocket = connectedUsers.get(to)
            // to tell the sender that it send a new msg so it can update its conversation list on front page
            let senderSocket = connectedUsers.get(from)
            if (receiverSocket) {
                receiverSocket.emit("receive-message", { message, toStatus, fromStatus });
                console.log("📤 Message emitted:", { from, to });
            }
            if (senderSocket) {
                senderSocket.emit("receive-message", { message, toStatus, fromStatus });
                console.log("📤 Message emitted:", { from, to });
            }
        });

        socket.on("messagesSeen", async ({ senderId, receiverId, seenAt }) => {
            // tell sender that their message has been seen
            console.log("message seen emit");

            try {
                await Message.updateMany(
                    { sender: senderId, receiver: receiverId },
                    { $set: { isSeen: true, seenAt: seenAt } }
                );
                console.log("message updated");
                let senderSocket = connectedUsers.get(senderId)
                senderSocket.emit("messagesSeenAck", { receiverId, seenAt });
            } catch (error) {
                console.log(error);
            }
        })

        // Handle disconnect and notify others with stored user info
        socket.on("disconnect", () => {
            connectedUsers.delete(socket.id);

            const user = cache.get(`user_${socket.userId}`)
            cache.set(`user_${user._id.toString()}`, { ...user, isOnline: false });


            io.emit("someone-offline", { userId: socket.userId, username: socket.username });
            console.log(`🔌 User disconnected: (${socket.username}) ${socket.id}`);
        });

    });


}
module.exports = start_socket_server;