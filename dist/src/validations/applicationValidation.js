"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateApplicationData = void 0;
const joi_1 = __importDefault(require("joi"));
const objectIdRegex = /^[a-fA-F0-9]{24}$/;
const validateApplicationData = (data) => {
    const schema = joi_1.default.object({
        candidateName: joi_1.default.string().required().messages({
            "string.empty": "Candidate name cannot be empty",
            "any.required": "Candidate name is required",
        }),
        phoneNumber: joi_1.default.string().required().messages({
            "string.empty": "Phone number cannot be empty",
            "any.required": "Phone number is required",
        }),
        email: joi_1.default.string().email().required().messages({
            "string.email": "Please enter a valid email address",
            "any.required": "Email is required",
        }),
        cv: joi_1.default.string().required().messages({
            "string.empty": "CV cannot be empty",
            "any.required": "CV is required",
        }),
        jobId: joi_1.default.string().pattern(objectIdRegex).required().messages({
            "string.empty": "Job ID cannot be empty",
            "any.required": "Job ID is required",
            "string.pattern.base": "Job ID must be a valid MongoDB ObjectId",
        }),
    });
    return schema.validate(data);
};
exports.validateApplicationData = validateApplicationData;
