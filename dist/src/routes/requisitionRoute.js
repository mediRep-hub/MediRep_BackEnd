"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const requisitionController_1 = require("../controller/requisitionController");
const router = express_1.default.Router();
router.post("/addRequisition", requisitionController_1.addRequisition);
router.get("/getAllRequisition", requisitionController_1.getAllRequisitions);
router.get("/getSingleRequisition/:id", requisitionController_1.getSingleRequisition);
router.put("/updateRequisition/:id", requisitionController_1.updateRequisition);
router.delete("/deleteRequisition/:id", requisitionController_1.deleteRequisition);
router.patch("/updateStatus/:id", requisitionController_1.updateStatus);
exports.default = router;
