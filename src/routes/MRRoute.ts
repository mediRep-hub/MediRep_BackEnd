import express from "express";
import {
  createMR,
  getAllMRs,
  getMRById,
  updateMR,
  deleteMR,
} from "../controller/MRController";

const router = express.Router();

router.post("/api/manageMr/addMR", createMR);
router.get("/api/manageMr/getAllMR", getAllMRs);
router.get("/api/manageMr/getSingleMR/:id", getMRById);
router.put("/api/manageMr/updateMR/:id", updateMR);
router.delete("/api/manageMr/deleteMR/:id", deleteMR);

export default router;
