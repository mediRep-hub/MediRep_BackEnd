import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  acceptOrder,
} from "../controller/orderControllers";

const router = express.Router();

router.post("/addOrder", createOrder);
router.get("/getAllOrders", getAllOrders);
router.get("/getOrder/:id", getOrderById);
router.put("/updateOrder/:id", updateOrder);
router.put("/acceptOrder", acceptOrder);
router.delete("/deleteOrder/:id", deleteOrder);

export default router;
