import express from "express";
import uploadController, { upload } from "../controller/uploadController";

const router = express.Router();

router.post("/api/uploadFile", upload, uploadController.uploadFileToCloudinary);

export default router;
