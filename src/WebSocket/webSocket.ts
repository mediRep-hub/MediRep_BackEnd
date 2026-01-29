export const ws = new WebSocket("http://localhost:5001");
// export const ws = new WebSocket("https://medi-rep-back-end.vercel.app");
const messageQueue: string[] = [];

ws.onopen = () => {
  console.log("✅ Connected to WebSocket server");

  // send queued messages
  while (messageQueue.length > 0) {
    ws.send(messageQueue.shift()!);
  }
};

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

// Ping server
export const pingServer = () => {
  const data = JSON.stringify({ type: "ping" });
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(data);
  } else {
    messageQueue.push(data);
    console.log("⚠️ WebSocket not ready, ping queued");
  }
};
