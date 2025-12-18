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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ProductSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
});
const RequisitionSchema = new mongoose_1.Schema({
    reqId: {
        type: String,
        required: true,
        unique: true,
        default: () => `REQ-${Date.now()}`,
    },
    mrName: { type: String, required: true },
    doctor: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true,
    },
    doctorName: { type: String, required: true },
    status: { type: String, default: "Pending" },
    attachedDoc: { type: String, required: true },
    details: { type: String, required: true },
    product: { type: [ProductSchema], required: true },
    startingDate: { type: Date, required: true },
    accepted: { type: Boolean, default: false },
    requisitionType: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: function () {
            return this.requisitionType === "Cash";
        },
    },
    remarks: { type: String },
    totalQuantity: { type: Number, default: 0 },
    duration: { type: String, default: "" },
}, { timestamps: true });
RequisitionSchema.pre("save", function (next) {
    if (this.product && this.product.length > 0) {
        this.totalQuantity = this.product.reduce((sum, item) => sum + (item.quantity || 0), 0);
    }
    else {
        this.totalQuantity = 0;
    }
    next();
});
exports.default = mongoose_1.default.model("Requisition", RequisitionSchema);
