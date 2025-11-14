import express from "express";
import {
  addCallReport,
  getAllCallReports,
  deleteCallReport,
  updateCallReport,
  reorderDoctorList,
} from "../controller/callReportingController";

const router = express.Router();

router.post("/addReport", addCallReport);
router.get("/getAllReports", getAllCallReports);
router.put("/updateReport/:id", updateCallReport);
router.put("/reorderDoctorList/:id", reorderDoctorList);
router.delete("/deleteReport/:id", deleteCallReport);

export default router;
