import express from "express";
import {
  addPharmacy,
  getPharmacyById,
  updatePharmacy,
  deletePharmacy,
  getAllPharmacies,
  uploadCSVPharmacy,
  getAllPharmaciesList,
} from "../controller/pharmacyContoller";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Pharmacy routes
router.post("/addPharmacy", addPharmacy);
router.get("/getAllPharmacies", getAllPharmacies);
router.get("/getAllPharmaciesList", getAllPharmaciesList);
router.get("/getSinglePharmacy/:id", getPharmacyById);
router.put("/updatePharmacy/:id", updatePharmacy);
router.delete("/deletePharmacy/:id", deletePharmacy);
router.post("/uploadPharmaciesCSV", upload.single("file"), uploadCSVPharmacy);

export default router;
