"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const accessToken_1 = __importDefault(require("../models/accessToken"));
const refreshToken_1 = __importDefault(require("../models/refreshToken"));
// Assuming these are string or undefined, make sure to check before use
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "default_access_secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret";
class JWTService {
    static signAccessToken(payload, expiryTime) {
        const options = { expiresIn: expiryTime };
        return jsonwebtoken_1.default.sign(payload, ACCESS_TOKEN_SECRET, options);
    }
    static signRefreshToken(payload, expiryTime) {
        const options = { expiresIn: expiryTime };
        return jsonwebtoken_1.default.sign(payload, REFRESH_TOKEN_SECRET, options);
    }
    // Verify access token
    static verifyAccessToken(token) {
        return jsonwebtoken_1.default.verify(token, ACCESS_TOKEN_SECRET);
    }
    // Verify refresh token
    static verifyRefreshToken(token) {
        return jsonwebtoken_1.default.verify(token, REFRESH_TOKEN_SECRET);
    }
    // Store refresh token in DB
    static async storeRefreshToken(token, userId, adminId) {
        try {
            const newToken = new refreshToken_1.default({
                token,
                userId,
                adminId,
            });
            await newToken.save();
        }
        catch (error) {
            console.error("Error storing refresh token:", error);
        }
    }
    // Store access token in DB
    static async storeAccessToken(token, userId, adminId) {
        try {
            const newToken = new accessToken_1.default({
                token,
                userId,
                adminId,
            });
            await newToken.save();
        }
        catch (error) {
            console.error("Error storing access token:", error);
        }
    }
}
exports.default = JWTService;
