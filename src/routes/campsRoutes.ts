import express from "express";
import {
  createCamp,
  getAllCamps,
  updateCampStatus,
} from "../controller/campsController";

const router = express.Router();

// ✅ CRUD
router.post("/create", createCamp);
router.get("/allcamps", getAllCamps);

// ✅ PATCH STATUS ONLY
router.patch("/status/:id", updateCampStatus);

export default router;
