import serverless from "serverless-http";
import app from "../src/server.js";

console.log("🔹 Starting serverless function...");

try {
  if (!app) {
    console.error("❌ Express app import failed");
  }
} catch (err) {
  console.error("❌ Import error:", err);
}

const handler = serverless(app);

export default async function main(req, res) {
  console.log("📩 Incoming request:", req.url);
  try {
    await handler(req, res);
  } catch (err) {
    console.error("🔥 Handler crashed:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Server crash", details: err.message });
    }
  }
}
