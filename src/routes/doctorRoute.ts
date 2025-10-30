import express from "express";
import {
  addDoctor,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getAllDoctors,
} from "../controller/doctorController";

const router = express.Router();

router.post("/api/doctor/addDoctor", addDoctor);
router.get("/api/doctor/getAllDoctor", getAllDoctors);
router.get("/api/doctor/getSingleDoctor/:id", getDoctorById);
router.put("/api/doctor/updateDoctor/:id", updateDoctor);
router.delete("/api/doctor/deleteDoctor/:id", deleteDoctor);

export default router;
