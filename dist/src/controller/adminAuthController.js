"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = require("mongoose");
const JWTService_1 = __importDefault(require("../services/JWTService"));
const refreshToken_1 = __importDefault(require("../models/refreshToken"));
const accessToken_1 = __importDefault(require("../models/accessToken"));
const admin_1 = __importDefault(require("../models/admin"));
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?/\\|-])[a-zA-Z\d!@#$%^&*()_+{}\[\]:;<>,.?/\\|-]{8,25}$/;
const adminAuthController = {
    async register(req, res, next) {
        // Validation schema
        const adminRegisterSchema = joi_1.default.object({
            name: joi_1.default.string().required(),
            phoneNumber: joi_1.default.string().required(),
            email: joi_1.default.string().email().required(),
            password: joi_1.default.string()
                .pattern(passwordPattern)
                .message("Must include 1 uppercase, 1 special character, and 1 digit.")
                .required(),
            confirmPassword: joi_1.default.string()
                .valid(joi_1.default.ref("password"))
                .required()
                .messages({ "any.only": "Passwords do not match" }),
            image: joi_1.default.string().optional(),
            division: joi_1.default.string().required(), // e.g., Admin, Distributor, MR
            area: joi_1.default.string().required(),
            region: joi_1.default.string().required(),
            strategy: joi_1.default.string().required(),
            position: joi_1.default.string().required(),
            ownerName: joi_1.default.string().when("division", {
                is: "Distributor",
                then: joi_1.default.string().required().messages({
                    "any.required": "Owner Name is required for Distributor",
                }),
                otherwise: joi_1.default.string().allow(""), // <-- Fix
            }),
        });
        const { error } = adminRegisterSchema.validate(req.body);
        if (error)
            return next(error);
        const { name, phoneNumber, email, password, image, division, area, region, strategy, position, ownerName, } = req.body;
        try {
            // Check if email exists
            const emailRegex = new RegExp(email, "i");
            const emailExists = await admin_1.default.findOne({
                email: { $regex: emailRegex },
            });
            if (emailExists)
                return next({ status: 409, message: "Email already registered" });
            // Hash password
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            // Generate unique adminId
            const generateAdminId = async (position) => {
                const initials = position
                    .split(" ")
                    .map((word) => word[0].toUpperCase())
                    .join("");
                let uniqueIdFound = false;
                let adminId = "";
                while (!uniqueIdFound) {
                    const randomDigits = Math.floor(1000 + Math.random() * 9000);
                    adminId = `${initials}-${randomDigits}`;
                    const existing = await admin_1.default.findOne({ adminId });
                    if (!existing)
                        uniqueIdFound = true;
                }
                return adminId;
            };
            const adminId = await generateAdminId(position);
            // Create admin object
            const adminToRegister = new admin_1.default({
                adminId,
                name,
                phoneNumber,
                email,
                password: hashedPassword,
                image,
                division,
                area,
                region,
                strategy,
                position,
                ownerName,
            });
            // Automatically assign distributor if division = MR
            if (division === "MR") {
                const distributor = await admin_1.default.findOne({
                    division: "Distributor",
                    area: area,
                });
                if (distributor) {
                    adminToRegister.distributor = distributor._id;
                }
            }
            const admin = await adminToRegister.save();
            // Generate JWT tokens
            const accessToken = JWTService_1.default.signAccessToken({ _id: admin._id.toString() }, "365d");
            const refreshToken = JWTService_1.default.signRefreshToken({ _id: admin._id.toString() }, "365d");
            await JWTService_1.default.storeRefreshToken(refreshToken, undefined, admin._id);
            await JWTService_1.default.storeAccessToken(accessToken, undefined, admin._id);
            // Remove password from response
            const { password: _, ...adminSafe } = admin.toObject();
            return res
                .status(201)
                .json({ admin: adminSafe, auth: true, token: accessToken });
        }
        catch (err) {
            return next(err);
        }
    },
    // 🔑 LOGIN
    async login(req, res, next) {
        const adminLoginSchema = joi_1.default.object({
            email: joi_1.default.string().email().required(),
            password: joi_1.default.string().required(),
        });
        const { error } = adminLoginSchema.validate(req.body);
        if (error)
            return next(error);
        const { email, password } = req.body;
        try {
            // Find admin by email
            const admin = await admin_1.default.findOne({
                email: new RegExp(`^${email}$`, "i"),
            }).lean();
            if (!admin) {
                return next({ status: 400, message: "Incorrect email or password." });
            }
            if (!admin.password) {
                return next({
                    status: 400,
                    message: "Password is missing for this admin account.",
                });
            }
            const match = await bcryptjs_1.default.compare(password, admin.password);
            if (!match) {
                return next({ status: 400, message: "Incorrect email or password." });
            }
            // 🔑 Dynamically attach distributor if MR
            let distributorInfo = null;
            if (admin.position === "MedicalRep(MR)") {
                // Always fetch the distributor for the same area
                const distributor = await admin_1.default.findOne({
                    division: "Distributor",
                    area: admin.area, // same area as MR
                })
                    .select("name email phoneNumber area region strategy position ownerName")
                    .lean();
                if (distributor)
                    distributorInfo = distributor;
            }
            // Generate tokens
            const accessToken = JWTService_1.default.signAccessToken({ _id: admin._id.toString() }, "365d");
            const refreshToken = JWTService_1.default.signRefreshToken({ _id: admin._id.toString() }, "365d");
            await refreshToken_1.default.updateOne({ adminId: admin._id }, { token: refreshToken }, { upsert: true });
            await accessToken_1.default.updateOne({ adminId: admin._id }, { token: accessToken }, { upsert: true });
            // Remove password
            const { password: _, ...adminSafe } = admin;
            // ✅ Attach distributor dynamically
            return res.status(200).json({
                admin: {
                    ...adminSafe,
                    distributor: distributorInfo, // this will show for all MRs in the same area
                },
                auth: true,
                token: accessToken,
            });
        }
        catch (err) {
            return next(err);
        }
    },
    // 🚪 LOGOUT
    async logout(req, res, next) {
        if (!req.user) {
            return next({ status: 401, message: "Unauthorized" });
        }
        const adminId = req.user._id;
        const authHeader = req.headers["authorization"];
        const accessToken = authHeader && authHeader.split(" ")[1];
        try {
            await refreshToken_1.default.deleteOne({ adminId });
            await accessToken_1.default.deleteOne({ token: accessToken });
            return res.status(200).json({ admin: null, auth: false });
        }
        catch (err) {
            return next(err);
        }
    },
    // 📝 GET ALL LOGINS
    async getAllAdmins(req, res, next) {
        try {
            // Parse page and limit from query params
            const page = parseInt(req.query.page) || 1; // default 1
            const limit = parseInt(req.query.limit) || 10; // default 10
            const skip = (page - 1) * limit;
            // Count total admins (excluding SuperAdmin)
            const totalItems = await admin_1.default.countDocuments({
                email: { $ne: "SuperAdmin@gmail.com" },
            });
            // Fetch admins with pagination
            const admins = await admin_1.default.find({
                email: { $ne: "SuperAdmin@gmail.com" },
            })
                .select("adminId name email phoneNumber division ownerName area region strategy position image")
                .skip(skip)
                .limit(limit)
                .sort({ name: 1 }); // optional sorting
            return res.status(200).json({
                admins,
                pagination: {
                    totalItems,
                    currentPage: page,
                    totalPages: Math.ceil(totalItems / limit),
                    itemsPerPage: limit,
                },
            });
        }
        catch (err) {
            return next(err);
        }
    },
    async updateAdmin(req, res, next) {
        const { id } = req.params;
        const { name, phoneNumber, email, password, confirmPassword, image, division, area, region, strategy, position, ownerName, } = req.body;
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return next({ status: 400, message: "Invalid Account ID" });
            }
            const admin = await admin_1.default.findById(id);
            if (!admin) {
                return next({ status: 404, message: "Account not found" });
            }
            // -----------------------------
            // Update normal fields
            // -----------------------------
            if (name)
                admin.name = name;
            if (phoneNumber)
                admin.phoneNumber = phoneNumber;
            if (email)
                admin.email = email;
            if (image)
                admin.image = image;
            if (area)
                admin.area = area;
            if (region)
                admin.region = region;
            if (strategy)
                admin.strategy = strategy;
            if (position)
                admin.position = position;
            // -----------------------------
            // Handle Division + OwnerName Logic
            // -----------------------------
            if (division) {
                admin.division = division;
                if (division === "Distributor") {
                    if (!ownerName) {
                        return next({
                            status: 400,
                            message: "Owner Name is required for Distributor division",
                        });
                    }
                    admin.ownerName = ownerName;
                }
                else {
                    admin.ownerName = ""; // Clear when division is NOT Distributor
                }
            }
            // -----------------------------
            // Password Update
            // -----------------------------
            if (password) {
                if (password !== confirmPassword) {
                    return next({ status: 400, message: "Passwords do not match" });
                }
                admin.password = await bcryptjs_1.default.hash(password, 10);
            }
            // Save updated admin
            const updatedAdmin = await admin.save();
            const { password: _, ...adminSafe } = updatedAdmin.toObject();
            return res.status(200).json({ admin: adminSafe });
        }
        catch (err) {
            return next(err);
        }
    },
    // 🗑️ DELETE ADMIN ACCOUNT
    async deleteAdmin(req, res, next) {
        try {
            const deletedAdmin = await admin_1.default.findByIdAndDelete(req.params.id);
            if (!deletedAdmin) {
                res.status(404).json({ message: "Account not found" });
                return;
            }
            res.status(200).json({ message: "Account deleted successfully" });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
};
exports.default = adminAuthController;
