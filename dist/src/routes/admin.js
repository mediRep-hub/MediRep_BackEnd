"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const adminAuthController_1 = __importDefault(require("../controller/adminAuthController"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const express = require("express");
const router = express.Router();
router.post("/register", adminAuthController_1.default.register);
router.post("/login", adminAuthController_1.default.login);
router.post("/logout", auth_1.default, adminAuthController_1.default.logout);
router.get("/getAll", adminAuthController_1.default.getAllAdmins);
router.put("/updateAccount/:id", adminAuthController_1.default.updateAdmin);
router.delete("/deleteAccount/:id", adminAuthController_1.default.deleteAdmin);
module.exports = router;
exports.default = router;
