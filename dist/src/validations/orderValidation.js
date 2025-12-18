"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOrderData = void 0;
const joi_1 = __importDefault(require("joi"));
const objectIdRegex = /^[a-fA-F0-9]{24}$/;
const medicineSchema = joi_1.default.object({
    medicineId: joi_1.default.string().pattern(objectIdRegex).required().messages({
        "any.required": "Medicine ID is required",
        "string.pattern.base": "Invalid Medicine ID (must be ObjectId)",
    }),
    quantity: joi_1.default.number().integer().min(1).required().messages({
        "any.required": "Quantity is required",
        "number.base": "Quantity must be a number",
        "number.min": "Quantity must be at least 1",
    }),
});
const validateOrderData = (data) => {
    const schema = joi_1.default.object({
        mrName: joi_1.default.string().required().messages({
            "string.empty": "MR Name cannot be empty",
            "any.required": "MR Name is required",
        }),
        distributorName: joi_1.default.string().required().messages({
            "string.empty": "Distributor Name cannot be empty",
            "any.required": "Distributor Name is required",
        }),
        pharmacyId: joi_1.default.string().pattern(objectIdRegex).required().messages({
            "any.required": "Pharmacy ID is required",
            "string.pattern.base": "Invalid Pharmacy ID (must be ObjectId)",
        }),
        address: joi_1.default.string().required().messages({
            "any.required": "Address is required",
            "string.empty": "Address cannot be empty",
        }),
        medicines: joi_1.default.array().min(1).items(medicineSchema).required().messages({
            "any.required": "Medicines are required",
            "array.base": "Medicines must be an array",
            "array.min": "At least one medicine is required",
        }),
        discount: joi_1.default.number().min(0).default(0).messages({
            "number.base": "Discount must be a number",
            "number.min": "Discount cannot be negative",
        }),
    });
    return schema.validate(data);
};
exports.validateOrderData = validateOrderData;
