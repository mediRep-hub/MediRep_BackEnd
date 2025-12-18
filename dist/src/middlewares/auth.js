"use strict";
// import { Request, Response, NextFunction } from "express";
// import mongoose from "mongoose";
// import JWTService from "../services/JWTService";
// import AccessToken from "../models/accessToken";
// import Admin from "../models/admin";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const JWTService_1 = __importDefault(require("../services/JWTService"));
const accessToken_1 = __importDefault(require("../models/accessToken"));
const admin_1 = __importDefault(require("../models/admin"));
// Define a mapping between route segments and Mongoose models (admin in this case)
const modelMap = {
    admin: admin_1.default, // Only admin should access /admin/* routes
};
// Middleware
const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const accessToken = authHeader?.split(" ")[1];
        // Skip auth check for public routes if needed
        const publicRoutes = ["/admin/login", "/admin/register"];
        if (publicRoutes.includes(req.originalUrl)) {
            return next();
        }
        // If no token, return 401
        if (!accessToken) {
            return next({
                status: 401,
                message: "Unauthorized: No access token provided",
            });
        }
        // Check if token exists in DB
        const tokenRecord = await accessToken_1.default.findOne({ token: accessToken });
        if (!tokenRecord) {
            return next({
                status: 401,
                message: "Your session has ended. Please log in again to continue",
            });
        }
        // Verify token
        let payload;
        try {
            payload = JWTService_1.default.verifyAccessToken(accessToken);
        }
        catch (error) {
            return next({
                status: 401,
                message: "Invalid or expired access token",
            });
        }
        // Allow logout route without role check
        const excludedRoutes = ["/admin/logout"];
        if (excludedRoutes.includes(req.originalUrl)) {
            req.user = await admin_1.default.findById(payload._id);
            return next();
        }
        // Determine model based on route segment
        const segments = req.originalUrl.split("/").filter(Boolean);
        const routePath = segments[0]; // e.g., "api" or "admin"
        let model;
        if (routePath === "api" || routePath === "admin") {
            model = modelMap.admin; // only admin allowed
        }
        else {
            return next({
                status: 403,
                message: "Access denied: Unrecognized role in route",
            });
        }
        // Fetch user from DB
        const user = await model.findById(payload._id);
        if (!user) {
            return next({
                status: 404,
                message: "User not found for the given route",
            });
        }
        // Attach user to request
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.default = auth;
