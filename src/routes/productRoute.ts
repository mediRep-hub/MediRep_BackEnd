import express from "express";
import {
  addProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  getMonthlyAchievement,
  uploadCSVUpdateTarget,
  uploadDiscountCSV,
} from "../controller/productController";

const router = express.Router();

router.post("/addProduct", addProduct);
router.get("/getAllProducts", getAllProducts);
router.get("/getMonthlyAchievement", getMonthlyAchievement);
router.put("/updateProduct/:id", updateProduct);
router.delete("/deleteProduct/:id", deleteProduct);
router.post("/uploadCSVUpdateTarget", uploadCSVUpdateTarget);
router.post("/uploadDiscountCSV", uploadDiscountCSV);

export default router;
