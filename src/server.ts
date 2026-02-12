import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnect from "./database";
import adminRouter from "./routes/admin";
import doctorRouter from "./routes/doctorRoute";
import productRoutes from "./routes/productRoute";
import callBrickRoutes from "./routes/brickRoute";
import requisitionRoutes from "./routes/requisitionRoute";
import uploadFileRoutes from "./routes/uploadRoute";
import orderRoutes from "./routes/orderRoutes";
import pharmacyRoutes from "./routes/pharmacyRoutes";
import secondarySale from "./routes/SecondarySalesRoutes";
import groupBrick from "./routes/brickGroupRoutes";
import stock from "./routes/stockReportRoutes";
import ErrorHandler from "./middlewares/errorHandler";
import { PORT } from "./config";
import { createServer } from "http";
import WebSocket, { WebSocketServer } from "ws";

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
  }),
);

// ✅ Root route
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "✅ Backend running successfully!",
    time: new Date().toISOString(),
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
app.use("/secondarySale", secondarySale);
app.use("/group", groupBrick);
app.use("/stock", stock);

app.use(ErrorHandler);

// ✅ Create HTTP server
const server = createServer(app);

// ✅ WebSocket setup
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

// ✅ Start server with DB connection
async function startServer() {
  try {
    await dbConnect();
    console.log("✅ MongoDB connected");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

export default app;
