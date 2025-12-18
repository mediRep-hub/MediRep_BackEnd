"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// app.js
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const admin_js_1 = __importDefault(require("../src/routes/admin.js"));
const doctorRoute_js_1 = __importDefault(require("../src/routes/doctorRoute.js"));
const productRoute_js_1 = __importDefault(require("../src/routes/productRoute.js"));
const brickRoute_js_1 = __importDefault(require("../src/routes/brickRoute.js"));
const requisitionRoute_js_1 = __importDefault(require("../src/routes/requisitionRoute.js"));
const pharmacyRoutes_1 = __importDefault(require("../src/routes/pharmacyRoutes"));
const uploadRoute_js_1 = __importDefault(require("../src/routes/uploadRoute.js"));
const orderRoutes_js_1 = __importDefault(require("../src/routes/orderRoutes.js"));
const errorHandler_js_1 = __importDefault(require("../src/middlewares/errorHandler.js"));
const primarySalesRoutes_1 = __importDefault(require("../src/routes/primarySalesRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// ✅ Middlewares
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
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
// ✅ Root route
app.get("/", (_req, res) => {
    res.status(200).json({
        message: "✅ GCC Backend (Serverless) is running successfully on Vercel!",
        timestamp: new Date().toISOString(),
    });
});
// ✅ Mount routes
app.use("/admin", admin_js_1.default);
app.use("/doctor", doctorRoute_js_1.default);
app.use("/product", productRoute_js_1.default);
app.use("/brick", brickRoute_js_1.default);
app.use("/requisition", requisitionRoute_js_1.default);
app.use("/upload", uploadRoute_js_1.default);
app.use("/orders", orderRoutes_js_1.default);
app.use("/pharmacy", pharmacyRoutes_1.default);
app.use("/primarySale", primarySalesRoutes_1.default);
app.use(errorHandler_js_1.default);
exports.default = app;
