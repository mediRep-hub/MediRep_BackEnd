import express from "express";
import {
  addCallReport,
  getAllCallReports,
  getCallReportById,
  updateCallReport,
  deleteCallReport,
} from "../controller/callReportingController";

const router = express.Router();

router.post("/api/callRepoeting/addReport", addCallReport);
router.get("/api/callRepoeting/getAllReports", getAllCallReports);
router.get("/api/callRepoeting/getSingleReport:id", getCallReportById);
router.put("/api/callRepoeting/updateReport/:id", updateCallReport);
router.delete("/api/callRepoeting/deleteReport/:id", deleteCallReport);

export default router;
