import express from "express";
import {
  addPatientsToCamp,
  createCamp,
  getAllCamps,
  getCampDashboardAnalytics,
  updateCampStatus,
} from "../controller/campsController";

const router = express.Router();

router.post("/create", createCamp);
router.get("/allcamps", getAllCamps);

router.patch("/status/:id", updateCampStatus);
router.post("/addPatients/:id", addPatientsToCamp);
router.get("/dashboard-stats", getCampDashboardAnalytics);

export default router;
