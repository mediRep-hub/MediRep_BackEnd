// app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnect from "../src/database";
import adminRouter from "../src/routes/admin.js";
import doctorRouter from "../src/routes/doctorRoute.js";
import productRoutes from "../src/routes/productRoute.js";
import callBrickRoutes from "../src/routes/brickRoute.js";
import requisitionRoutes from "../src/routes/requisitionRoute.js";
import pharmacyRoutes from "../src/routes/pharmacyRoutes";
import uploadFileRoutes from "../src/routes/uploadRoute.js";
import orderRoutes from "../src/routes/orderRoutes.js";
import ErrorHandler from "../src/middlewares/errorHandler.js";
import primarySale from "../src/routes/primarySalesRoutes";
import groupBrick from "../src/routes/brickGroupRoutes";

dotenv.config();

const app = express();

// ✅ Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://medi-rep-front-end.vercel.app",
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

// ✅ Root route
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "✅ GCC Backend (Serverless) is running successfully on Vercel!",
    timestamp: new Date().toISOString(),
  });
});

// ✅ Mount routes
app.use("/admin", adminRouter);
app.use("/doctor", doctorRouter);
app.use("/product", productRoutes);
app.use("/brick", callBrickRoutes);
app.use("/requisition", requisitionRoutes);
app.use("/upload", uploadFileRoutes);
app.use("/orders", orderRoutes);
app.use("/pharmacy", pharmacyRoutes);
app.use("/primarySale", primarySale);
app.use("/group", groupBrick);

app.use(ErrorHandler);

export default app;
