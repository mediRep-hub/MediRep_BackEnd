import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnect from "./database";
import adminRouter from "./routes/admin";
import doctorRouter from "./routes/doctorRoute";
import productRoutes from "./routes/productRoute";
import callReportingRoutes from "./routes/callReportingRoute";
import requisitionRoutes from "./routes/requisitionRoute";
import uploadFileRoutes from "./routes/uploadRoute";
import orderRoutes from "./routes/orderRoutes";
import pharmacyRoutes from "./routes/pharmacyRoutes";
import ErrorHandler from "./middlewares/errorHandler";
import { PORT } from "./config";
import { createServer } from "http";
import WebSocket, { WebSocketServer } from "ws";

dotenv.config();

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS
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

// Default route
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "✅ Backend running successfully!",
    time: new Date().toISOString(),
  });
});

// MongoDB connection
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

// Mount routes
app.use("/admin", adminRouter);
app.use("/doctor", doctorRouter);
app.use("/product", productRoutes);
app.use("/pharmacy", pharmacyRoutes);
app.use("/callreport", callReportingRoutes);
app.use("/requisition", requisitionRoutes);
app.use("/upload", uploadFileRoutes);
app.use("/orders", orderRoutes);

app.use(ErrorHandler);

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket) => {
  console.log("New WebSocket client connected");
  ws.send(JSON.stringify({ message: "Welcome to WebSocket server!" }));
  ws.on("message", (data) => {
    console.log("Received from client:", data.toString());
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ message: data.toString() }));
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
