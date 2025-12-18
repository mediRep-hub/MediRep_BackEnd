"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orderControllers_1 = require("../controller/orderControllers");
const router = express_1.default.Router();
router.post("/addOrder", orderControllers_1.createOrder);
router.get("/getAllOrders", orderControllers_1.getAllOrders);
router.get("/getOrder/:id", orderControllers_1.getOrderById);
router.put("/updateOrder/:id", orderControllers_1.updateOrder);
router.put("/acceptOrder", orderControllers_1.acceptOrder);
router.delete("/deleteOrder/:id", orderControllers_1.deleteOrder);
exports.default = router;
