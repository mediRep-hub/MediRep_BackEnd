"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequisitionData = void 0;
const joi_1 = __importDefault(require("joi"));
const objectIdRegex = /^[a-fA-F0-9]{24}$/;
const productSchema = joi_1.default.object({
    name: joi_1.default.string().required().messages({
        "any.required": "Product name is required",
        "string.empty": "Product name cannot be empty",
    }),
    quantity: joi_1.default.number().min(1).required().messages({
        "any.required": "Product quantity is required",
        "number.base": "Quantity must be a number",
        "number.min": "Quantity must be at least 1",
    }),
});
const validateRequisitionData = (data) => {
    const schema = joi_1.default.object({
        mrName: joi_1.default.string().required().messages({
            "any.required": "MR Name is required",
            "string.empty": "MR Name cannot be empty",
        }),
        // Single doctor fields
        doctor: joi_1.default.string().pattern(objectIdRegex).required().messages({
            "any.required": "Doctor ID is required",
            "string.pattern.base": "Invalid Doctor ID",
        }),
        doctorName: joi_1.default.string().required().messages({
            "any.required": "Doctor Name is required",
            "string.empty": "Doctor Name cannot be empty",
        }),
        status: joi_1.default.string().optional(),
        attachedDoc: joi_1.default.string().required().messages({
            "any.required": "Attached document is required",
            "string.empty": "Attached document cannot be empty",
        }),
        details: joi_1.default.string().required().messages({
            "any.required": "Details are required",
            "string.empty": "Details cannot be empty",
        }),
        product: joi_1.default.array().items(productSchema).min(1).required().messages({
            "any.required": "Product list is required",
            "array.min": "At least one product is required",
        }),
        startingDate: joi_1.default.date().required().messages({
            "any.required": "Starting date is required",
            "date.base": "Starting date must be a valid date",
        }),
        accepted: joi_1.default.boolean().optional(),
        remarks: joi_1.default.string().optional(),
        totalQuantity: joi_1.default.number().optional(),
        duration: joi_1.default.string().optional(),
        requisitionType: joi_1.default.string().required().messages({
            "any.required": "Requisition type is required",
        }),
        amount: joi_1.default.number().when("requisitionType", {
            is: "cash",
            then: joi_1.default.required().messages({
                "any.required": "Amount is required for cash requisition",
            }),
            otherwise: joi_1.default.optional(),
        }),
        region: joi_1.default.string().optional(),
        strategyName: joi_1.default.string().optional(),
        route: joi_1.default.string().optional(),
        day: joi_1.default.string().optional(),
    }).unknown(true); // allows extra fields
    return schema.validate(data, { abortEarly: false });
};
exports.validateRequisitionData = validateRequisitionData;
