import express from "express";
import {
  createSecondarySale,
  getAllSecondarySales,
  updateSecondarySale,
  deleteSecondarySale,
  uploadBulkSecondarySales,
} from "../controller/SecondarySalesController";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
// Routes
router.post(
  "/uploadBulkSecondarySales",
  upload.single("file"),
  uploadBulkSecondarySales
);
router.post("/createSecondarySale", createSecondarySale);
router.get("/getAllSecondarySales", getAllSecondarySales);
router.put("/updateSecondarySale/:id", updateSecondarySale);
router.delete("/deleteSecondarySale/:id", deleteSecondarySale);

export default router;
