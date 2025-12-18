"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const doctorController_1 = require("../controller/doctorController");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post("/addDoctor", doctorController_1.addDoctor);
router.get("/getAllDoctor", doctorController_1.getAllDoctors);
router.get("/getAllDoctorslist", doctorController_1.getAllDoctorslist);
router.get("/getSingleDoctor/:id", doctorController_1.getDoctorById);
router.put("/updateDoctor/:id", doctorController_1.updateDoctor);
router.delete("/deleteDoctor/:id", doctorController_1.deleteDoctor);
router.post("/uploadDoctorsCSV", upload.single("file"), doctorController_1.uploadCSVDoctor);
exports.default = router;
