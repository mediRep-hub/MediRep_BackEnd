import express from "express";
import {
  addProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  uploadCSVUpdateTarget,
} from "../controller/productController";
import { uploadDoctorsCSV } from "../controller/doctorController";

const router = express.Router();

router.post("/addProduct", addProduct);
router.get("/getAllProducts", getAllProducts);
router.put("/updateProduct/:id", updateProduct);
router.delete("/deleteProduct/:id", deleteProduct);
router.post("/uploadCSVUpdateTarget", uploadCSVUpdateTarget);
router.post("/uploadDoctorsCSV", uploadDoctorsCSV);

export default router;
