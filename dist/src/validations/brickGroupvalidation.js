"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesGroupValidation = void 0;
const joi_1 = __importDefault(require("joi"));
exports.SalesGroupValidation = joi_1.default.object({
    groupName: joi_1.default.string().required(),
    groupType: joi_1.default.string().required(),
    region: joi_1.default.string().required(),
    area: joi_1.default.string().required(),
    doctors: joi_1.default.array().items(joi_1.default.string()).required(),
    manager: joi_1.default.string().required(),
    teamLead: joi_1.default.string().required(),
    period: joi_1.default.string().required(),
    distributorName: joi_1.default.string().required(),
    mr: joi_1.default.array().items(joi_1.default.string()).required(),
    products: joi_1.default.array()
        .items(joi_1.default.object({
        name: joi_1.default.string().required(),
        target: joi_1.default.number().required(),
        bonus: joi_1.default.number().required(),
    }))
        .required(),
});
