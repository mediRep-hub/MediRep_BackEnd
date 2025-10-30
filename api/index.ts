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

// ✅ Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://medi-rep-front-end.vercel.app", // ✅ no trailing slash
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

// ✅ Root route must be defined before routes
app.get("/", (req, res) => {
  res.status(200).json({
    message: "✅ GCC Backend (Serverless) is running successfully on Vercel!",
    timestamp: new Date().toISOString(),
  });
});

// ✅ Database connect (lazy)
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
app.use("/admin", adminRouter);
app.use("/doctor", doctorRouter);
app.use("/product", productRoutes);
app.use("/callreport", callReportingRoutes);
app.use("/manageMr", MRRoutes);
app.use("/requisition", requisitionRoutes);
app.use("/upload", uploadFileRoutes);

app.use(ErrorHandler);

// ✅ Required for Vercel — convert to a serverless handler
export default app;
