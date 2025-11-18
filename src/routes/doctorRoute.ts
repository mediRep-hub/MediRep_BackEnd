import express from "express";
import {
  addDoctor,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getAllDoctors,
  uploadCSVDoctor,
  getAllDoctorslist,
} from "../controller/doctorController";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/addDoctor", addDoctor);
router.get("/getAllDoctor", getAllDoctors);
router.get("/getAllDoctorslist", getAllDoctorslist);
router.get("/getSingleDoctor/:id", getDoctorById);
router.put("/updateDoctor/:id", updateDoctor);
router.delete("/deleteDoctor/:id", deleteDoctor);
router.post("/uploadDoctorsCSV", upload.single("file"), uploadCSVDoctor);

export default router;
