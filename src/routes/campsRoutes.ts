import express from "express";
import {
  addPatientsToCamp,
  createCamp,
  getAllCamps,
  getCampBarStats,
  getCampDashboardStats,
  updateCampStatus,
} from "../controller/campsController";

const router = express.Router();

// ✅ CRUD
router.post("/create", createCamp);
router.get("/allcamps", getAllCamps);

router.patch("/status/:id", updateCampStatus);
router.post("/addPatients/:id", addPatientsToCamp);
router.get("/dashboard-stats", getCampDashboardStats);
router.get("/bar-stats", getCampBarStats);

export default router;
