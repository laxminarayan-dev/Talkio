// socket.js
import Cookies from "js-cookie"
import { io } from "socket.io-client";
const socket = io("http://192.168.29.98:8000", {
    auth: {
        userId: Cookies.get("token"),
        username: Cookies.get("username")
    },
    autoConnect: true
});

export default socket;
