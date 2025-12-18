"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const primarySalesController_1 = require("../controller/primarySalesController");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Routes
router.post("/uploadBulkPrimarySales", upload.single("file"), primarySalesController_1.uploadBulkPrimarySales);
router.post("/createPrimarySale", primarySalesController_1.createPrimarySale);
router.get("/getAllPrimarySales", primarySalesController_1.getAllPrimarySales);
router.put("/updatePrimarySale/:id", primarySalesController_1.updatePrimarySale);
router.delete("/deletePrimarySale/:id", primarySalesController_1.deletePrimarySale);
exports.default = router;
