import express from "express";
import {
  createSalesGroup,
  getAllSalesGroups,
  getSalesGroupById,
  updateSalesGroup,
  deleteSalesGroup,
} from "../controller/brickGroupControllers";

const router = express.Router();

router.post("/createSalesGroup", createSalesGroup);
router.get("/getAllSalesGroups", getAllSalesGroups);
router.get("/getAllSalesGroups/:id", getAllSalesGroups);
router.put("/updateSalesGroup/:id", updateSalesGroup);
router.delete("/deleteSalesGroup/:id", deleteSalesGroup);

export default router;
