const express = require("express");
const dbConnection = require("./onStart/connection")
const start_socket_server = require("./onStart/socket");
const loadUsersToCache = require("./onStart/cachedUser")
const cache = require("./onStart/cache");
const cors = require("cors")
const http = require("http");
const app = express();
const server = http.createServer(app);
const auth = require("./routes/auth")
const user = require("./routes/user")
const message = require("./routes/message")

app.use(cors())
app.use(express.json())




dbConnection().then(async () => {
    await loadUsersToCache(cache)
    app.get("/", (req, res) => {
        res.send("working")
    })
    app.use("/api/auth", auth)
    app.use("/api/user", user)
    app.use("/api/messages", message)
    start_socket_server(server, cache);
})

server.listen(8000, () => {
    console.log(`
============================== 
Server started on port 8000
============================== `);
});
