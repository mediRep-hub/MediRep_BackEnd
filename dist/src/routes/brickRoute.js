"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const brickController_1 = require("../controller/brickController");
const router = express_1.default.Router();
router.post("/addBrick", brickController_1.addBrick);
router.get("/getAllBricks", brickController_1.getAllBricks);
router.put("/updateBrick/:id", brickController_1.updateBrick);
router.put("/reorderDoctorList/:id", brickController_1.reorderDoctorList);
router.delete("/deleteBrick/:id", brickController_1.deleteBrick);
router.post("/checkDoctorLocation", brickController_1.checkDoctorLocation);
exports.default = router;
