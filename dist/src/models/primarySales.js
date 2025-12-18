"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Distributor = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ProductSchema = new mongoose_1.default.Schema({
    sku: { type: String, required: true },
    productName: { type: String, required: true },
    openBalance: { type: Number, default: 0 },
    purchaseQNT: { type: Number, default: 0 },
    saleQty: { type: Number, default: 0 },
    purchaseReturn: { type: Number, default: 0 },
    saleReturnQNT: { type: Number, default: 0 },
    netSale: { type: Number, default: 0 },
    floorStockValue: { type: Number, default: 0 },
});
const DistributorSchema = new mongoose_1.default.Schema({
    distributorId: {
        type: String,
        unique: true,
        default: () => `D-${Date.now()}`,
    },
    distributorName: { type: String, required: true },
    area: { type: String, required: true },
    primarySale: { type: Number, default: 0 },
    totalSaleQNT: { type: Number, default: 0 },
    floorStockQNT: { type: Number, default: 0 },
    floorStockValue: { type: Number, default: 0 },
    status: { type: String, default: "active" },
    products: [ProductSchema],
}, { timestamps: true });
exports.Distributor = mongoose_1.default.model("Distributor", DistributorSchema);
