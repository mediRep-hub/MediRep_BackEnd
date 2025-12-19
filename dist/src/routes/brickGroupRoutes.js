"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const brickGroupControllers_1 = require("../controller/brickGroupControllers");
const router = express_1.default.Router();
router.post("/", brickGroupControllers_1.createSalesGroup);
router.get("/", brickGroupControllers_1.getAllSalesGroups);
router.get("/:id", brickGroupControllers_1.getSalesGroupById);
router.put("/:id", brickGroupControllers_1.updateSalesGroup);
router.delete("/:id", brickGroupControllers_1.deleteSalesGroup);
exports.default = router;
