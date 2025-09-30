// socket.js
import Cookies from "js-cookie"
import { io } from "socket.io-client";
const backend_url = import.meta.env.VITE_BACKEND_URL
const socket = io(backend_url, {
    auth: {
        userId: Cookies.get("token"),
        username: Cookies.get("username")
    },
    autoConnect: true
});

export default socket;
