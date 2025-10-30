import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import dbConnect from "./database";
import ErrorHandler from "./middlewares/errorHandler";

import adminRouter from "./routes/admin";
import doctorRouter from "./routes/doctorRoute";
import productRoutes from "./routes/productRoute";
import callReportingRoutes from "./routes/callReportingRoute";
import MRRoutes from "./routes/MRRoute";
import requisitionRoutes from "./routes/requisitionRoute";
import uploadFileRoutes from "./routes/uploadRoute";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://www.gulbergcitycentre.com/",
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(adminRouter);
app.use(doctorRouter);
app.use(productRoutes);
app.use(callReportingRoutes);
app.use(MRRoutes);
app.use(requisitionRoutes);
app.use(uploadFileRoutes);
app.use(ErrorHandler);

dbConnect({ retries: 5, delay: 5000 })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection failed:", err));

export default app;
