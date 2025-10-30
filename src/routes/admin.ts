import adminAuthController from "../controller/adminAuthController";
import auth from "../middlewares/auth";

const express = require("express");

const router = express.Router();

router.post("/api/admin/register", adminAuthController.register);
router.post("/api/admin/login", adminAuthController.login);
router.post("/api/admin/logout", auth, adminAuthController.logout);
router.get("/api/admin/getAll", adminAuthController.getAllAdmins);
router.put("/api/admin/updateAccount/:id", adminAuthController.updateAdmin);
router.delete(
  "/api/admin/deleteAccount/:id",

  adminAuthController.deleteAdmin
);

module.exports = router;
