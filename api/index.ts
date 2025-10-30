// api/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnect from "../src/database";
import adminRouter from "../src/routes/admin.js";
// ...other routers
import ErrorHandler from "../src/middlewares/errorHandler.js";

dotenv.config();
const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(cors({ origin: true, credentials: true }));

// Default route
app.get("/", (_req, res) => res.json({ message: "Backend running!" }));

// MongoDB caching
let isConnected = false;
async function ensureDBConnection() {
  if (!isConnected) {
    try {
      await dbConnect();
      console.log("MongoDB connected");
      isConnected = true;
    } catch (err) {
      console.error("DB connect error:", err);
    }
  }
}

// Middleware to ensure DB connection
app.use(async (_req, _res, next) => {
  await ensureDBConnection();
  next();
});

// Mount routers
app.use("/admin", adminRouter);
// ...other routers
app.use(ErrorHandler);

// Export for Vercel
export default async function handler(req: any, res: any) {
  return app(req, res);
}
