"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const productSchema = new mongoose_1.default.Schema({
    productName: { type: String, required: true },
    category: { type: String, required: true },
    isfrom: { type: String, required: true },
    amount: { type: Number, required: true },
    productImage: { type: String, required: true },
    strength: { type: String, required: true },
    isStatus: { type: String, required: true },
    sku: { type: String, unique: true },
    packSize: { type: String, required: true },
    achievement: { type: Number, default: 0 },
    target: { type: Number, default: 0 },
});
productSchema.pre("save", function (next) {
    if (!this.sku) {
        const prefix = this.productName
            .substring(0, 3)
            .toUpperCase()
            .replace(/\s+/g, "");
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        this.sku = `${prefix}-${randomNum}`;
    }
    next();
});
const Product = mongoose_1.default.model("Product", productSchema);
exports.default = Product;
