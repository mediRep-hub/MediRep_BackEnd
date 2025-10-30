import app from "../src/server.js";

export default async function handler(req: any, res: any) {
  try {
    await new Promise<void>((resolve, reject) => {
      app(req, res, (err: any) => {
        if (err) reject(err);
        else resolve();
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
