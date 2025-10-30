import app from "../src/server.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const expressApp = app as any;

    // Ensure it's a function before calling
    if (typeof expressApp !== "function") {
      throw new Error("Express app is not a function. Check your export.");
    }

    await new Promise<void>((resolve, reject) => {
      expressApp(req, res, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (err: any) {
    console.error("🔥 Serverless handler error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        details: err?.message || "Unknown error",
      });
    }
  }
}
