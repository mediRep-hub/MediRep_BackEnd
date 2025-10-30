import express from "express";
import {
  addRequisition,
  getAllRequisitions,
  getSingleRequisition,
  updateRequisition,
  deleteRequisition,
  updateAccepted,
} from "../controller/requisitionController";

const router = express.Router();

router.post("/api/requisition/addRequisition", addRequisition);
router.get("/api/requisition/getAllRequisition", getAllRequisitions);
router.get("/api/requisition/getSingleRequisition/:id", getSingleRequisition);
router.put("/api/requisition/updateRequisition/:id", updateRequisition);
router.delete("/api/requisition/deleteRequisition/:id", deleteRequisition);
router.patch("/api/requisition/updateAccepted/:id", updateAccepted);

export default router;
