import express from "express";
import {
  addCallReport,
  getAllCallReports,
} from "../controller/callReportingController";

const router = express.Router();

router.post("/addReport", addCallReport);
router.get("/getAllReports", getAllCallReports);
// router.get("/getSingleReport:id", getCallReportById);
// router.put("/updateReport/:id", updateCallReport);
// router.delete("/deleteReport/:id", deleteCallReport);

export default router;
