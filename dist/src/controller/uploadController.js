"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const uuid_1 = require("uuid");
const multer_1 = __importDefault(require("multer"));
const cloudinaryConfig_1 = __importDefault(require("../cloudinary/cloudinaryConfig"));
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({ storage }).single("file");
const uploadController = {
    async uploadFileToCloudinary(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }
            const fileType = req.query.fileType || "assets";
            const file = req.file;
            const fileName = `${(0, uuid_1.v4)()}-${file.originalname}`;
            const base64String = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
            const result = await cloudinaryConfig_1.default.uploader.upload(base64String, {
                folder: `MedRep/${fileType}`,
                public_id: fileName,
                resource_type: "auto",
            });
            return res.status(200).json({
                url: result.secure_url,
                public_id: result.public_id,
            });
        }
        catch (err) {
            console.error("Error uploading to Cloudinary:", err);
            next(err);
        }
    },
};
exports.default = uploadController;
