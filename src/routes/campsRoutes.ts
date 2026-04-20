import express from "express";
import {
  addPatientsToCamp,
  createCamp,
  getAllCamps,
  updateCampStatus,
} from "../controller/campsController";

const router = express.Router();

// ✅ CRUD
router.post("/create", createCamp);
router.get("/allcamps", getAllCamps);

router.patch("/status/:id", updateCampStatus);
router.post("/addPatients/:id", addPatientsToCamp);

export default router;
