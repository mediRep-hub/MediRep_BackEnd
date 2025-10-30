import express from "express";
import {
  addProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
} from "../controller/productController";

const router = express.Router();

router.post("/addProduct", addProduct);
router.get("/getAllProducts", getAllProducts);
router.put("/updateProduct/:id", updateProduct);
router.delete("/deleteProduct/:id", deleteProduct);

export default router;
