import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnect from "./database";
import adminRouter from "./routes/admin";
import doctorRouter from "./routes/doctorRoute";
import productRoutes from "./routes/productRoute";
import callReportingRoutes from "./routes/callReportingRoute";
import MRRoutes from "./routes/MRRoute";
import requisitionRoutes from "./routes/requisitionRoute";
import uploadFileRoutes from "./routes/uploadRoute";
import strategyRoutes from "./routes/strategyRoutes";
import orderRoutes from "./routes/orderRoutes";
import ErrorHandler from "./middlewares/errorHandler";
import { PORT } from "./config";

dotenv.config();

const app = express();

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

// ✅ Default route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "✅ Backend running successfully on Vercel!",
    time: new Date().toISOString(),
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ✅ MongoDB connect once
let isConnected = false;
async function ensureDBConnection() {
  if (!isConnected) {
    try {
      await dbConnect();
      console.log("✅ MongoDB connected");
      isConnected = true;
    } catch (err) {
      console.error("❌ DB connection failed:", err);
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
app.use("/strategy", strategyRoutes);
app.use("/orders", orderRoutes);

app.use(ErrorHandler);

export default app;
