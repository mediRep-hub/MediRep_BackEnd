import express from "express";
import multer from "multer";
import {
  getAllStockReports,
  uploadStockFile,
} from "../controller/stockReportcontroller";

const router = express.Router();

/* Multer config */
const upload = multer({ dest: "uploads/" });

router.get("/getAllStockReports", getAllStockReports);
router.post("/uploadStockCSV", upload.single("file"), uploadStockFile);

export default router;
