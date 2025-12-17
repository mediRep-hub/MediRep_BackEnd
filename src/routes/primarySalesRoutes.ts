import express from "express";
import {
  createPrimarySale,
  getAllPrimarySales,
  updatePrimarySale,
  deletePrimarySale,
  uploadBulkPrimarySales,
} from "../controller/primarySalesController";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
// Routes
router.post(
  "/uploadBulkPrimarySales",
  upload.single("file"),
  uploadBulkPrimarySales
);
router.post("/createPrimarySale", createPrimarySale);
router.get("/getAllPrimarySales", getAllPrimarySales);
router.put("/updatePrimarySale/:id", updatePrimarySale);
router.delete("/deletePrimarySale/:id", deletePrimarySale);

export default router;
