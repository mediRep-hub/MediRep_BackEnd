import { Router } from "express";
import {
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from "../controller/brickGroupControllers";

const router = Router();

router.get("/getAllGroups", getAllGroups);
router.post("/createGroup", createGroup);
router.put("/updateGroup/:id", updateGroup);
router.delete("/deleteGroup/:id", deleteGroup);

export default router;
