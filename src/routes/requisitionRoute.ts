import express from "express";
import {
  addRequisition,
  getAllRequisitions,
  getSingleRequisition,
  updateRequisition,
  deleteRequisition,
  updateStatus,
} from "../controller/requisitionController";

const router = express.Router();

router.post("/addRequisition", addRequisition);
router.get("/getAllRequisition", getAllRequisitions);
router.get("/getSingleRequisition/:id", getSingleRequisition);
router.put("/updateRequisition/:id", updateRequisition);
router.delete("/deleteRequisition/:id", deleteRequisition);
router.patch("/updateStatus/:id", updateStatus);

export default router;
