"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const orderSchema = new mongoose_1.default.Schema({
    orderId: { type: String, required: true, unique: true },
    mrName: { type: String, required: true },
    distributorName: { type: String, required: true },
    pharmacyId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Pharmacy",
        required: true,
    },
    address: { type: String, required: true },
    medicines: [
        {
            medicineId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            quantity: { type: Number, required: true },
        },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number },
    total: { type: Number, required: true },
    IStatus: { type: Boolean, required: true },
}, { timestamps: true });
exports.Order = mongoose_1.default.model("Order", orderSchema);
