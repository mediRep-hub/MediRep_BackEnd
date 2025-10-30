import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from "express";
import { PORT } from "./config/index";
import ErrorHandler from "./middlewares/errorHandler";
import dbConnect from "./database";
import doctorRouter from "./routes/doctorRoute";
import productRoutes from "./routes/productRoute";
import callReportingRoutes from "./routes/callReportingRoute";
import MRRoutes from "./routes/MRRoute";
import requisitionRoutes from "./routes/requisitionRoute";
import uploadFileRoutes from "./routes/uploadRoute";
import cors from "cors";
const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://www.gulbergcitycentre.com/",
];

app.use(
  cors({
    origin: function (origin: any, callback: any) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

dbConnect({ retries: 5, delay: 5000 })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start the server:", error);
  });

const adminRouter = require("./routes/admin");

app.use(adminRouter);
app.use(doctorRouter);
app.use(productRoutes);
app.use(callReportingRoutes);
app.use(MRRoutes);
app.use(requisitionRoutes);
app.use(uploadFileRoutes);
app.use(ErrorHandler);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
