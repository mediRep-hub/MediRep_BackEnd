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

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ CORS setup
const allowedOrigins = [
  "http://localhost:5173",
  "https://medi-rep-front-end-x2l4.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.options("*", cors());

// ✅ MongoDB connection caching
let dbConnected = false;
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!dbConnected) {
      await dbConnect();
      dbConnected = true;
    }
    next();
  } catch (err) {
    console.error("❌ Database connection error:", err);
    next(err);
  }
});

// ✅ Test route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "✅ GCC Backend (Serverless) running on Vercel!",
    time: new Date().toISOString(),
  });
});

// ✅ Mount routes
app.use("/admin", adminRouter);
app.use("/doctor", doctorRouter);
app.use("/product", productRoutes);
app.use("/callreport", callReportingRoutes);
app.use("/manageMr", MRRoutes);
app.use("/requisition", requisitionRoutes);
app.use("/upload", uploadFileRoutes);

// ✅ Error middleware
app.use(ErrorHandler);

export default app;
