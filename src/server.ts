// src/server.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnect from "./database";
import adminRouter from "./routes/admin.js";
import doctorRouter from "./routes/doctorRoute.js";
import productRoutes from "./routes/productRoute.js";
import callReportingRoutes from "./routes/callReportingRoute.js";
import MRRoutes from "./routes/MRRoute.js";
import requisitionRoutes from "./routes/requisitionRoute.js";
import uploadFileRoutes from "./routes/uploadRoute.js";
import ErrorHandler from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();

// ✅ Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://medi-rep-front-end-x2l4.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow server-to-server calls
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// Handle preflight requests
app.options("*", cors());

// ✅ Default route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "✅ GCC Backend (Serverless) is running on Vercel!",
    time: new Date().toISOString(),
  });
});

// ✅ MongoDB connection caching for serverless
let isConnected = false;
async function ensureDBConnection() {
  if (isConnected) return;
  try {
    await dbConnect(); // your MongoDB connection function
    console.log("✅ MongoDB connected");
    isConnected = true;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    throw err;
  }
}

// Run DB connection before every request
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await ensureDBConnection();
    next();
  } catch (err) {
    next(err);
  }
});

// ✅ Async handler wrapper to catch errors in routes
export const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ✅ Mount routes
app.use("/admin", adminRouter);
app.use("/doctor", doctorRouter);
app.use("/product", productRoutes);
app.use("/callreport", callReportingRoutes);
app.use("/manageMr", MRRoutes);
app.use("/requisition", requisitionRoutes);
app.use("/upload", uploadFileRoutes);

// ✅ Error handler
app.use(ErrorHandler);

export default app;
