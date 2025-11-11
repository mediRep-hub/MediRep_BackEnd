import express from "express";
import {
  addCallReport,
  getAllCallReports,
  deleteCallReport,
  updateCallReport,
} from "../controller/callReportingController";

const router = express.Router();

router.post("/addReport", addCallReport);
router.get("/getAllReports", getAllCallReports);
router.put("/updateReport/:id", updateCallReport);
router.delete("/deleteReport/:id", deleteCallReport);

export default router;
