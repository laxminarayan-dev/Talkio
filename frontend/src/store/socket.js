// socket.js
import { io } from "socket.io-client";

const backend_url = import.meta.env.VITE_BACKEND_URL;

// Extract protocol + host (remove /talkio-backend)
//const { origin } = new URL(backend_url);
if(!backend_url){
  console.log("nothing")
}
else{
  console.log("something")
}

const socket = io(backend_url, {
  path: "/socket.io",
  // path: "/talkio-backend/socket.io",
  autoConnect: false,
  transports: ["websocket"],
  pingInterval: 25000,
  pingTimeout: 60000,
});


export default socket;
