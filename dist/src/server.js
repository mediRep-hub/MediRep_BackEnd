"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("./database"));
const admin_1 = __importDefault(require("./routes/admin"));
const doctorRoute_1 = __importDefault(require("./routes/doctorRoute"));
const productRoute_1 = __importDefault(require("./routes/productRoute"));
const brickRoute_1 = __importDefault(require("./routes/brickRoute"));
const requisitionRoute_1 = __importDefault(require("./routes/requisitionRoute"));
const uploadRoute_1 = __importDefault(require("./routes/uploadRoute"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const pharmacyRoutes_1 = __importDefault(require("./routes/pharmacyRoutes"));
const primarySalesRoutes_1 = __importDefault(require("./routes/primarySalesRoutes"));
const errorHandler_1 = __importDefault(require("./middlewares/errorHandler"));
const config_1 = require("./config");
const http_1 = require("http");
const ws_1 = __importStar(require("ws"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// CORS
const allowedOrigins = [
    "http://localhost:5173",
    "https://medi-rep-front-end.vercel.app",
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin))
            callback(null, true);
        else
            callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));
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
            await (0, database_1.default)();
            console.log("✅ MongoDB connected");
            isConnected = true;
        }
        catch (err) {
            console.error("❌ DB connection failed:", err);
        }
    }
}
app.use(async (_req, _res, next) => {
    await ensureDBConnection();
    next();
});
// Mount routes
app.use("/admin", admin_1.default);
app.use("/doctor", doctorRoute_1.default);
app.use("/product", productRoute_1.default);
app.use("/pharmacy", pharmacyRoutes_1.default);
app.use("/brick", brickRoute_1.default);
app.use("/requisition", requisitionRoute_1.default);
app.use("/upload", uploadRoute_1.default);
app.use("/orders", orderRoutes_1.default);
app.use("/primarySale", primarySalesRoutes_1.default);
app.use(errorHandler_1.default);
const server = (0, http_1.createServer)(app);
const wss = new ws_1.WebSocketServer({ server });
wss.on("connection", (ws) => {
    console.log("New WebSocket client connected");
    ws.send(JSON.stringify({ message: "Welcome to WebSocket server!" }));
    ws.on("message", (data) => {
        console.log("Received from client:", data.toString());
        wss.clients.forEach((client) => {
            if (client.readyState === ws_1.default.OPEN) {
                client.send(JSON.stringify({ message: data.toString() }));
            }
        });
    });
    ws.on("close", () => {
        console.log("Client disconnected");
    });
});
// Start server
server.listen(config_1.PORT, () => {
    console.log(`Server running on http://localhost:${config_1.PORT}`);
});
exports.default = app;
