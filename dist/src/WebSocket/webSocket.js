"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pingServer = exports.sendMessage = exports.ws = void 0;
// export const ws = new WebSocket("http://localhost:5001");
exports.ws = new WebSocket("https://medi-rep-back-end.vercel.app/");
const messageQueue = [];
exports.ws.onopen = () => {
    console.log("✅ Connected to WebSocket server");
    // send queued messages
    while (messageQueue.length > 0) {
        exports.ws.send(messageQueue.shift());
    }
};
exports.ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Received:", data);
};
// Safe send function
const sendMessage = (msg) => {
    const data = JSON.stringify({ type: "chat", payload: msg });
    if (exports.ws.readyState === WebSocket.OPEN) {
        exports.ws.send(data);
    }
    else {
        messageQueue.push(data);
        console.log("⚠️ WebSocket not ready, message queued");
    }
};
exports.sendMessage = sendMessage;
// Ping server
const pingServer = () => {
    const data = JSON.stringify({ type: "ping" });
    if (exports.ws.readyState === WebSocket.OPEN) {
        exports.ws.send(data);
    }
    else {
        messageQueue.push(data);
        console.log("⚠️ WebSocket not ready, ping queued");
    }
};
exports.pingServer = pingServer;
