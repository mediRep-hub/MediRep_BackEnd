// api/index.ts
import app from "../src/server.js"; // your Express app

// ✅ Serverless handler for Vercel
export default async function handler(req: any, res: any) {
  try {
    // Let Express handle the request
    await new Promise<void>((resolve, reject) => {
      app(req, res, (err: any) => {
        if (err) reject(err); // catch Express errors
        else resolve(); // request completed successfully
      });
    });
  } catch (err: any) {
    console.error("Serverless handler error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      details: err.message || "Unknown error",
    });
  }
}
