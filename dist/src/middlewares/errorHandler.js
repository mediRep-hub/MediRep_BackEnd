"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = require("joi");
const errorHandler = (error, req, res, next) => {
    const status = error instanceof joi_1.ValidationError
        ? 400
        : error.status || 500;
    const message = error instanceof joi_1.ValidationError
        ? error.message
        : error.message || "Internal Server Error";
    return res.status(status).json({ message });
};
exports.default = errorHandler;
