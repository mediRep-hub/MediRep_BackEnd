const isProd = process.env.NODE_ENV === "production";

const WS_URL = isProd
  ? "wss://medi-rep-back-end.vercel.app"
  : "ws://localhost:5001";
export const ws = new WebSocket(WS_URL);

const messageQueue: string[] = [];

// Connection opened
ws.onopen = () => {
  console.log("✅ WebSocket connected:", WS_URL);

  // Send queued messages
  while (messageQueue.length > 0) {
    ws.send(messageQueue.shift()!);
  }
};

// Listen for messages
ws.onmessage = (event: MessageEvent) => {
  const data = JSON.parse(event.data);
  console.log("Received:", data);
};

// Safe send function
export const sendMessage = (msg: string) => {
  const data = JSON.stringify({ type: "chat", payload: msg });
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(data);
  } else {
    messageQueue.push(data);
    console.log("⚠️ WebSocket not ready, message queued");
  }
};

// Safe ping
export const pingServer = () => {
  const data = JSON.stringify({ type: "ping" });
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(data);
  } else {
    messageQueue.push(data);
    console.log("⚠️ WebSocket not ready, ping queued");
  }
};
