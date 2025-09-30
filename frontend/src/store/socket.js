// socket.js
import { io } from "socket.io-client";

const backend_url = import.meta.env.VITE_BACKEND_URL;

const socket = io(backend_url, {
    autoConnect: false,
    transports: ["websocket"], // helps prevent polling issues on Render
});

export default socket;
