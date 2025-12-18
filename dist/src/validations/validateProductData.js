"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProductData = void 0;
const joi_1 = __importDefault(require("joi"));
const skuRegex = /^[A-Z]{3}-\d{4}$/;
const validateProductData = (data) => {
    const schema = joi_1.default.object({
        productName: joi_1.default.string().min(2).max(100).required().messages({
            "any.required": "Product Name is required",
            "string.empty": "Product Name cannot be empty",
            "string.min": "Product Name must be at least 2 characters",
            "string.max": "Product Name cannot exceed 100 characters",
        }),
        category: joi_1.default.string().required().messages({
            "any.required": "Category is required",
            "string.empty": "Category cannot be empty",
        }),
        isfrom: joi_1.default.string().required().messages({
            "any.required": "isfrom field is required",
            "string.empty": "isfrom cannot be empty",
        }),
        amount: joi_1.default.number().positive().required().messages({
            "any.required": "Amount is required",
            "number.base": "Amount must be a number",
            "number.positive": "Amount must be a positive number",
        }),
        productImage: joi_1.default.string().uri().required().messages({
            "any.required": "Product Image is required",
            "string.uri": "Product Image must be a valid URL",
        }),
        strength: joi_1.default.string().required().messages({
            "any.required": "Strength is required",
            "string.empty": "Strength cannot be empty",
        }),
        isStatus: joi_1.default.string().valid("Active", "Discontinued").required().messages({
            "any.required": "Status is required",
            "any.only": "Status must be either 'Active' or 'Discontinued'",
        }),
        sku: joi_1.default.string().pattern(skuRegex).optional().messages({
            "string.pattern.base": "SKU format is invalid (Example: ABC-1234)",
        }),
        packSize: joi_1.default.string().required().messages({
            "any.required": "Pack Size is required",
            "string.empty": "Pack Size cannot be empty",
        }),
        achievement: joi_1.default.number().min(0).optional().messages({
            "number.base": "Achievement must be a number",
            "number.min": "Achievement cannot be negative",
        }),
        target: joi_1.default.number().min(0).optional().messages({
            "number.base": "Target must be a number",
            "number.min": "Target cannot be negative",
        }),
    });
    return schema.validate(data, { abortEarly: false });
};
exports.validateProductData = validateProductData;
