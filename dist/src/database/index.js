"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/database.ts
const mongoose_1 = __importDefault(require("mongoose"));
let cached = global.mongoose || { conn: null, promise: null };
const dbConnect = async () => {
    if (cached.conn) {
        console.log("⚡ Using existing MongoDB connection");
        return;
    }
    const uri = process.env.MONGODB_CONNECTION_STRING;
    if (!uri) {
        throw new Error("❌ MONGODB_CONNECTION_STRING not set in environment variables");
    }
    if (!cached.promise) {
        mongoose_1.default.set("strictQuery", false);
        cached.promise = mongoose_1.default
            .connect(uri, {
            dbName: "medi-rep",
            maxPoolSize: 5,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        })
            .then((mongooseInstance) => {
            console.log("✅ MongoDB connected:", mongooseInstance.connection.host);
            return mongooseInstance;
        })
            .catch((err) => {
            console.error("❌ MongoDB connection error:", err);
            throw err;
        });
    }
    cached.conn = await cached.promise;
    global.mongoose = cached;
};
exports.default = dbConnect;
