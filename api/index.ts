import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnect from "../src/database";
import adminRouter from "../src/routes/admin.js";
import doctorRouter from "../src/routes/doctorRoute.js";
import productRoutes from "../src/routes/productRoute.js";
import callReportingRoutes from "../src/routes/callReportingRoute.js";
import MRRoutes from "../src/routes/MRRoute.js";
import requisitionRoutes from "../src/routes/requisitionRoute.js";
import uploadFileRoutes from "../src/routes/uploadRoute.js";
import ErrorHandler from "../src/middlewares/errorHandler.js";

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

// ✅ Default route for testing
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "✅ GCC Backend (Serverless) running on Vercel!",
    timestamp: new Date().toISOString(),
  });
});

// ✅ Database connection (run once)
let isConnected = false;
async function ensureDBConnection() {
  if (!isConnected) {
    try {
      await dbConnect();
      console.log("✅ MongoDB Connected");
      isConnected = true;
    } catch (err) {
      console.error("❌ MongoDB connection failed:", err);
    }
  }
}
app.use(async (_req, _res, next) => {
  await ensureDBConnection();
  next();
});

// ✅ Mount routes
// app.use("/api/admin", adminRouter);
// app.use("/api/doctor", doctorRouter);
// app.use("/api/product", productRoutes);
// app.use("/api/callreport", callReportingRoutes);
// app.use("/api/mr", MRRoutes);
app.use("/api/requisition", requisitionRoutes);
// app.use("/api/upload", uploadFileRoutes);

app.use(ErrorHandler);

// ✅ Export default (for Vercel)
export default app;
