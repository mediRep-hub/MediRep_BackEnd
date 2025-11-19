import express from "express";
import { fetchWithFilters } from "../controller/filterController";

const router = express.Router();

router.post("/fetch", fetchWithFilters); // ✅ This is correct
export default router;
