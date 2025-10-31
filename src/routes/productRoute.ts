import express from "express";
import {
  addProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  uploadCSVUpdateTarget,
} from "../controller/productController";

const router = express.Router();

router.post("/addProduct", addProduct);
router.get("/getAllProducts", getAllProducts);
router.put("/updateProduct/:id", updateProduct);
router.delete("/deleteProduct/:id", deleteProduct);
router.post("/uploadCSVUpdateTarget", uploadCSVUpdateTarget);

export default router;
