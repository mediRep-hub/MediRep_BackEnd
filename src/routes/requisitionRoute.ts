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

router.post("/addRequisition", addRequisition);
router.get("/getAllRequisition", getAllRequisitions);
router.get("/getSingleRequisition/:id", getSingleRequisition);
router.put("/updateRequisition/:id", updateRequisition);
router.delete("/deleteRequisition/:id", deleteRequisition);
router.patch("/updateAccepted/:id", updateAccepted);

export default router;
