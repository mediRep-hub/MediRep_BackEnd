import express from "express";
import {
  createMR,
  getAllMRs,
  getMRById,
  updateMR,
  deleteMR,
} from "../controller/MRController";

const router = express.Router();

router.post("/addMR", createMR);
router.get("/getAllMR", getAllMRs);
router.get("/getSingleMR/:id", getMRById);
router.put("/updateMR/:id", updateMR);
router.delete("/deleteMR/:id", deleteMR);

export default router;
