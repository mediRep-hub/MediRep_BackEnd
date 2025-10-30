import express from "express";
import {
  addProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
} from "../controller/productController";

const router = express.Router();

router.post("/api/product/addProduct", addProduct);
router.get("/api/product/getAllProducts", getAllProducts);
router.put("/api/product/updateProduct/:id", updateProduct);
router.delete("/api/product/deleteProduct/:id", deleteProduct);

export default router;
