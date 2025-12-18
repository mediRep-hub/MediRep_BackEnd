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
const uuid_1 = require("uuid");
const generateShortId = () => {
    return `CALL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};
// ---------------- SUB SCHEMA ----------------
const doctorSubSchema = new mongoose_1.Schema({
    doctor: { type: mongoose_1.Schema.Types.ObjectId, ref: "Doctor", required: true },
    callId: { type: String, default: generateShortId, required: true },
    status: {
        type: String,
        enum: ["pending", "close", "check In"],
        default: "pending",
    },
    activeRequisition: { type: String, default: "" },
    checkIn: { type: String, default: "" },
    checkOut: { type: String, default: "" },
    duration: { type: String, default: "" },
    productDiscussed: { type: String, default: "" },
    doctorResponse: { type: String, default: "" },
    promotionalMaterialGiven: { type: String, default: "" },
    followUpRequired: { type: String, default: "" },
    doctorPurchaseInterest: { type: String, default: "" },
    nextVisitDate: { type: Date, default: null },
    keyDiscussionPoints: { type: String, default: "" },
    doctorConcerns: { type: String, default: "" },
    discussionType: { type: String, default: "" },
    checkInLocation: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
    },
    doctorAvailability: { type: String, default: "" },
    reason: { type: String, default: "" },
});
// ---------------- MAIN SCHEMA (Brick) ----------------
const brickSchema = new mongoose_1.Schema({
    region: { type: String },
    area: { type: String },
    brickName: { type: String },
    route: { type: String },
    day: { type: String },
    mrName: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin", required: true },
    doctorList: [doctorSubSchema],
    products: [{ type: String, required: true }], // ✅ array of strings
}, { timestamps: true });
// ---------------- STATIC METHOD ----------------
brickSchema.statics.prepareDoctorList = function (doctorIds) {
    return doctorIds.map((id) => ({
        doctor: new mongoose_1.Types.ObjectId(id),
        callId: `CALL-${(0, uuid_1.v4)()}`,
        status: "pending",
        activeRequisition: "",
        checkIn: "",
        checkOut: "",
        duration: "",
        productDiscussed: "",
        doctorResponse: "",
        promotionalMaterialGiven: "",
        followUpRequired: "",
        doctorPurchaseInterest: "",
        nextVisitDate: null,
        keyDiscussionPoints: "",
        doctorConcerns: "",
        discussionType: "",
        checkInLocation: { lat: 0, lng: 0 },
        doctorAvailability: "",
        reason: "",
    }));
};
// ---------------- MODEL ----------------
const Brick = mongoose_1.default.model("Brick", brickSchema);
exports.default = Brick;
// export const validateCheckLocation = (data: any) => {
//   const schema = Joi.object({
//     callReportId: Joi.string().pattern(objectIdRegex).required().messages({
//       "any.required": "Call Report ID is required",
//       "string.pattern.base": "Invalid Call Report ID",
//     }),
//     doctorId: Joi.string().pattern(objectIdRegex).required().messages({
//       "any.required": "Doctor ID is required",
//       "string.pattern.base": "Invalid Doctor ID",
//     }),
//     lat: Joi.number().required().messages({
//       "any.required": "Latitude is required",
//       "number.base": "Latitude must be a number",
//     }),
//     lng: Joi.number().required().messages({
//       "any.required": "Longitude is required",
//       "number.base": "Longitude must be a number",
//     }),
//   });
//   return schema.validate(data, { abortEarly: false });
// };
