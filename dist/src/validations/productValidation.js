"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProductData = void 0;
const joi_1 = __importDefault(require("joi"));
const validateProductData = (data) => {
    const schema = joi_1.default.object({
        productName: joi_1.default.string().required().messages({
            "any.required": "Product name is required",
            "string.empty": "Product name cannot be empty",
        }),
        category: joi_1.default.string().required().messages({
            "any.required": "Category is required",
            "string.empty": "Category cannot be empty",
        }),
        isfrom: joi_1.default.string().required().messages({
            "any.required": "Isfrom is required",
            "string.empty": "Isfrom cannot be empty",
        }),
        amount: joi_1.default.number().required().messages({
            "any.required": "Amount is required",
            "number.base": "Amount must be a number",
        }),
        productImage: joi_1.default.string().uri().required().messages({
            "any.required": "Product image is required",
            "string.uri": "Product image must be a valid URL",
        }),
        strength: joi_1.default.string().required().messages({
            "any.required": "Strength is required",
            "string.empty": "Strength cannot be empty",
        }),
        specialty: joi_1.default.string().required().messages({
            "any.required": "Specialty is required",
            "string.empty": "Specialty cannot be empty",
        }),
        isStatus: joi_1.default.string().required().messages({
            "any.required": "Status is required",
            "string.empty": "Status cannot be empty",
        }),
        sku: joi_1.default.string().optional().messages({
            "string.base": "SKU must be a string",
        }),
        packSize: joi_1.default.string().required().messages({
            "any.required": "Pack size is required",
            "string.empty": "Pack size cannot be empty",
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
