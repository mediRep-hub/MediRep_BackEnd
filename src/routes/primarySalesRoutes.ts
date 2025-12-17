import express from "express";
import {
  createPrimarySale,
  getAllPrimarySales,
  updatePrimarySale,
  deletePrimarySale,
  uploadBulkPrimarySales,
} from "../controller/primarySalesController";

const router = express.Router();

// Routes
router.post("/uploadBulkPrimarySales", uploadBulkPrimarySales);
router.post("/createPrimarySale", createPrimarySale);
router.get("/getAllPrimarySales", getAllPrimarySales);
router.put("/updatePrimarySale/:id", updatePrimarySale);
router.delete("/deletePrimarySale/:id", deletePrimarySale);

export default router;
