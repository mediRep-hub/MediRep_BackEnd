"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ProductSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    target: { type: Number, required: true },
    bonus: { type: Number, required: true },
});
const SalesGroupSchema = new mongoose_1.default.Schema({
    groupName: { type: String, required: true },
    groupType: { type: String, required: true },
    region: { type: String, required: true },
    area: { type: String, required: true },
    doctors: [{ type: String, required: true }],
    manager: { type: String, required: true },
    teamLead: { type: String, required: true },
    period: { type: String, required: true },
    distributorName: { type: String, required: true },
    mr: [{ type: String, required: true }],
    products: [ProductSchema],
}, { timestamps: true });
exports.default = mongoose_1.default.model("SalesGroup", SalesGroupSchema);
