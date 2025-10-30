import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnect from "../src/database";
import adminRouter from "../src/routes/admin";
import doctorRouter from "../src/routes/doctorRoute";
import productRoutes from "../src/routes/productRoute";
import callReportingRoutes from "../src/routes/callReportingRoute";
import MRRoutes from "../src/routes/MRRoute";
import requisitionRoutes from "../src/routes/requisitionRoute";
import uploadFileRoutes from "../src/routes/uploadRoute";
import ErrorHandler from "../src/middlewares/errorHandler";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://gulbergcitycentre.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`📨 ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ Lazy DB connection (runs only once)
let isConnected = false;
async function ensureDBConnection() {
  if (!isConnected) {
    try {
      await dbConnect({ retries: 5, delay: 5000 });
      console.log("✅ MongoDB Connected (Vercel Function)!");
      isConnected = true;
    } catch (err) {
      console.error("❌ MongoDB connection failed:", err);
    }
  }
}

// ✅ Ensure DB connection before handling routes
app.use(async (_req, _res, next) => {
  await ensureDBConnection();
  next();
});

// ✅ Root route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "✅ GCC Backend (Serverless) is working!",
    status: "success",
    timestamp: new Date().toISOString(),
  });
});

// ✅ Mount all routes
// app.use(adminRouter);
// app.use(doctorRouter);
// app.use(productRoutes);
// app.use(callReportingRoutes);
// app.use(MRRoutes);
app.use("/api/requisition", requisitionRoutes);
// app.use(uploadFileRoutes);

// ✅ Error handler
app.use(ErrorHandler);

// 🚀 Export for Vercel (no app.listen)
export default app;
