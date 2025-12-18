"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDoctorData = void 0;
const joi_1 = __importDefault(require("joi"));
const validateDoctorData = (data) => {
    const schema = joi_1.default.object({
        docId: joi_1.default.string().optional().messages({
            "string.base": "Doctor ID must be a string",
        }),
        name: joi_1.default.string().optional().allow("").messages({
            "string.base": "Name must be a string",
        }),
        specialty: joi_1.default.string().optional().allow(""),
        email: joi_1.default.string().email().optional().allow("").messages({
            "string.email": "Invalid email format",
        }),
        phone: joi_1.default.string().optional().allow(""),
        startTime: joi_1.default.string()
            .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
            .optional()
            .allow("")
            .messages({
            "string.pattern.base": "Start time must be in HH:mm format",
        }),
        endTime: joi_1.default.string()
            .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
            .optional()
            .allow("")
            .messages({
            "string.pattern.base": "End time must be in HH:mm format",
        }),
        region: joi_1.default.string().optional().allow(""),
        area: joi_1.default.string().optional().allow(""),
        affiliation: joi_1.default.string().optional().allow(""),
        image: joi_1.default.string().uri().optional().allow("").messages({
            "string.uri": "Image must be a valid URL",
        }),
        location: joi_1.default.object({
            address: joi_1.default.string().optional().allow(""),
            lat: joi_1.default.number().optional(),
            lng: joi_1.default.number().optional(),
        }).optional(),
    });
    return schema.validate(data, { abortEarly: false });
};
exports.validateDoctorData = validateDoctorData;
