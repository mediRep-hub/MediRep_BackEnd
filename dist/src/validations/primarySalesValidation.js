"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.distributorValidationSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// Product validation schema
const productSchema = joi_1.default.object({
    sku: joi_1.default.string().required().messages({
        "string.empty": "SKU is required",
    }),
    productName: joi_1.default.string().required().messages({
        "string.empty": "Product name is required",
    }),
    openBalance: joi_1.default.number().min(0).default(0),
    purchaseQNT: joi_1.default.number().min(0).default(0),
    purchaseReturn: joi_1.default.number().min(0).default(0),
    saleReturnQNT: joi_1.default.number().min(0).default(0),
    netSale: joi_1.default.number().min(0).default(0),
    floorStockValue: joi_1.default.number().min(0).default(0),
    saleQty: joi_1.default.number().min(0).default(0),
});
// Distributor validation schema
exports.distributorValidationSchema = joi_1.default.object({
    distributorName: joi_1.default.string().required().messages({
        "string.empty": "Distributor Name is required",
    }),
    area: joi_1.default.string().required().messages({
        "string.empty": "Area is required",
    }),
    primarySale: joi_1.default.number().min(0).default(0),
    totalSaleQNT: joi_1.default.number().min(0).default(0),
    floorStockQNT: joi_1.default.number().min(0).default(0),
    floorStockValue: joi_1.default.number().min(0).default(0),
    status: joi_1.default.string().valid("active", "inactive").default("active"),
    products: joi_1.default.array().items(productSchema).min(1).messages({
        "array.min": "At least one product is required",
    }),
});
