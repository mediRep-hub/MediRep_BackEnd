import express from "express";
import {
  addBrick,
  getAllBricks,
  deleteBrick,
  updateBrick,
  reorderDoctorList,
  checkDoctorLocation,
} from "../controller/brickController";

const router = express.Router();
router.post("/addBrick", addBrick);
router.get("/getAllBricks", getAllBricks);
router.put("/updateBrick/:id", updateBrick);
router.put("/reorderDoctorList/:id", reorderDoctorList);
router.delete("/deleteBrick/:id", deleteBrick);
router.post("/checkDoctorLocation", checkDoctorLocation);

export default router;
