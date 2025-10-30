import adminAuthController from "../controller/adminAuthController";
import auth from "../middlewares/auth";

const express = require("express");

const router = express.Router();

router.post("/register", adminAuthController.register);
router.post("/login", adminAuthController.login);
router.post("/logout", auth, adminAuthController.logout);
router.get("/getAll", adminAuthController.getAllAdmins);
router.put("/updateAccount/:id", adminAuthController.updateAdmin);
router.delete(
  "/deleteAccount/:id",

  adminAuthController.deleteAdmin
);

module.exports = router;
export default router;
