import express from "express";
import {
  addStrategy,
  getAllStrategies,
  getStrategyById,
  updateStrategy,
  deleteStrategy,
} from "../controller/strategyControllers";

const router = express.Router();

router.post("/addStrategy", addStrategy);
router.get("/getAllStrategies", getAllStrategies);
router.get("/getStrategyById/:id", getStrategyById);
router.put("/updateStrategy/:id", updateStrategy);
router.delete("/deleteStrategy/:id", deleteStrategy);

export default router;
