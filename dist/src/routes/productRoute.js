"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController_1 = require("../controller/productController");
const router = express_1.default.Router();
router.post("/addProduct", productController_1.addProduct);
router.get("/getAllProducts", productController_1.getAllProducts);
router.get("/getAllProductsMR", productController_1.getAllProductsMR);
router.get("/getMonthlyAchievement", productController_1.getMonthlyAchievement);
router.put("/updateProduct/:id", productController_1.updateProduct);
router.delete("/deleteProduct/:id", productController_1.deleteProduct);
router.post("/uploadCSVUpdateTarget", productController_1.uploadCSVUpdateTarget);
exports.default = router;
