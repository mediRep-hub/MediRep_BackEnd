import express from "express";
import {
  addDoctor,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getAllDoctors,
  uploadDoctorsCSV,
} from "../controller/doctorController";

const router = express.Router();

router.post("/addDoctor", addDoctor);
router.get("/getAllDoctor", getAllDoctors);
router.get("/getSingleDoctor/:id", getDoctorById);
router.put("/updateDoctor/:id", updateDoctor);
router.delete("/deleteDoctor/:id", deleteDoctor);
router.post("/uploadDoctorsCSV", uploadDoctorsCSV);

export default router;
