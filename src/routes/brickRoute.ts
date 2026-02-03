import express from "express";
import {
  createBrick,
  getAllBricks,
  deleteBrick,
  updateBrick,
} from "../controller/brickController";

const router = express.Router();
router.post("/createBrick", createBrick);
router.get("/getAllBricks", getAllBricks);
router.put("/updateBrick/:id", updateBrick);
router.delete("/deleteBrick/:id", deleteBrick);

export default router;
