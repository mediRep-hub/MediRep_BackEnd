import dotenv from "dotenv";
import serverless from "serverless-http";
import dbConnect from "../src/database";
import app from "../src/server";
import { Request, Response } from "express";
import adminRouter from "../src/routes/admin";
import doctorRouter from "../src/routes/doctorRoute";
import productRoutes from "../src/routes/productRoute";
import callReportingRoutes from "../src/routes/callReportingRoute";
import MRRoutes from "../src/routes/MRRoute";
import requisitionRoutes from "../src/routes/requisitionRoute";
import uploadFileRoutes from "../src/routes/uploadRoute";

dotenv.config();

let cachedHandler: any = null;

const getHandler = async () => {
  if (!cachedHandler) {
    console.log("⏳ Connecting to MongoDB (Vercel cold start)...");
    await dbConnect({ retries: 5, delay: 5000 });
    console.log("✅ MongoDB connected — caching handler...");
    cachedHandler = serverless(app);
  }
  return cachedHandler;
};

app.use(adminRouter);
app.use(doctorRouter);
app.use(productRoutes);
app.use(callReportingRoutes);
app.use(MRRoutes);
app.use(requisitionRoutes);
app.use(uploadFileRoutes);

// ✅ Use Express types here — they work fine with Vercel
export default async function handler(req: Request, res: Response) {
  const server = await getHandler();
  return server(req, res);
}
