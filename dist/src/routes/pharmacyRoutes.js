"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pharmacyContoller_1 = require("../controller/pharmacyContoller");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// ✅ Pharmacy routes
router.post("/addPharmacy", pharmacyContoller_1.addPharmacy);
router.get("/getAllPharmacies", pharmacyContoller_1.getAllPharmacies);
router.get("/getAllPharmaciesList", pharmacyContoller_1.getAllPharmaciesList);
router.get("/getSinglePharmacy/:id", pharmacyContoller_1.getPharmacyById);
router.put("/updatePharmacy/:id", pharmacyContoller_1.updatePharmacy);
router.delete("/deletePharmacy/:id", pharmacyContoller_1.deletePharmacy);
router.post("/uploadPharmaciesCSV", upload.single("file"), pharmacyContoller_1.uploadCSVPharmacy);
exports.default = router;
