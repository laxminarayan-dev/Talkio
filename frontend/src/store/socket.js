// socket.js
import { io } from "socket.io-client";

const backend_url = import.meta.env.VITE_BACKEND_URL;

console.log("In socket.js backend_url is : ",backend_url)
const socket = io(backend_url, {
    autoConnect: false,
    transports: ["websocket"], // helps prevent polling issues on Render
    pingInterval: 25000,
    pingTimeout: 60000,
});

export default socket;
