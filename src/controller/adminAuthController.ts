import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import JWTService from "../services/JWTService";
import RefreshToken from "../models/refreshToken";
import AccessToken from "../models/accessToken";
import Admin from "../models/admin";

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?/\\|-])[a-zA-Z\d!@#$%^&*()_+{}\[\]:;<>,.?/\\|-]{8,25}$/;

declare module "express" {
  interface Request {
    user?: any;
  }
}

const adminAuthController = {
  // 🧾 REGISTER
  async register(req: Request, res: Response, next: NextFunction) {
    const adminRegisterSchema = Joi.object({
      name: Joi.string().required(),
      phoneNumber: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string()
        .pattern(passwordPattern)
        .message("Must include 1 uppercase, 1 special character, and 1 digit.")
        .required(),
      confirmPassword: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({ "any.only": "Passwords do not match" }),
      image: Joi.string().optional(),
      division: Joi.string().required(),
      area: Joi.string().required(),
      region: Joi.string().required(),
      strategy: Joi.string().required(),
      position: Joi.string().required(),
    });

    const { error } = adminRegisterSchema.validate(req.body);
    if (error) return next(error);

    const {
      name,
      phoneNumber,
      email,
      password,
      image,
      division,
      area,
      region,
      strategy,
      position,
    } = req.body;

    try {
      // Check if email already exists
      const emailRegex = new RegExp(email, "i");
      const emailExists = await Admin.findOne({
        email: { $regex: emailRegex },
      });
      if (emailExists)
        return next({ status: 409, message: "Email already registered" });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate unique adminId based on position
      const generateAdminId = async (position: string) => {
        const initials = position
          .split(" ")
          .map((word) => word[0].toUpperCase())
          .join("");

        let uniqueIdFound = false;
        let adminId = "";

        while (!uniqueIdFound) {
          const randomDigits = Math.floor(1000 + Math.random() * 9000); // 1000-9999
          adminId = `${initials}-${randomDigits}`;

          const existing = await Admin.findOne({ adminId });
          if (!existing) uniqueIdFound = true;
        }

        return adminId;
      };

      const adminId = await generateAdminId(position);

      // Create new Admin
      const adminToRegister = new Admin({
        adminId, // <-- Generated ID
        name,
        phoneNumber,
        email,
        password: hashedPassword,
        image,
        division,
        area,
        region,
        strategy,
        position,
      });

      const admin = await adminToRegister.save();

      // Generate tokens
      const accessToken = JWTService.signAccessToken(
        { _id: admin._id.toString() },
        "365d"
      );
      const refreshToken = JWTService.signRefreshToken(
        { _id: admin._id.toString() },
        "365d"
      );

      await JWTService.storeRefreshToken(refreshToken, undefined, admin._id);
      await JWTService.storeAccessToken(accessToken, undefined, admin._id);

      // Remove password safely
      const { password: _, ...adminSafe } = admin.toObject();

      return res
        .status(201)
        .json({ admin: adminSafe, auth: true, token: accessToken });
    } catch (err) {
      return next(err);
    }
  },
  // 🔑 LOGIN
  async login(req: Request, res: Response, next: NextFunction) {
    const adminLoginSchema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });

    const { error } = adminLoginSchema.validate(req.body);
    if (error) return next(error);

    const { email, password } = req.body;

    try {
      const emailRegex = new RegExp(email, "i");
      const admin = await Admin.findOne({ email: { $regex: emailRegex } });

      if (!admin) {
        return next({ status: 400, message: "Incorrect email or password." });
      }

      if (!admin.password) {
        return next({
          status: 400,
          message: "Password is missing for this admin account.",
        });
      }

      const match = await bcrypt.compare(password, admin.password);
      if (!match) {
        return next({ status: 400, message: "Incorrect email or password." });
      }

      const accessToken = JWTService.signAccessToken(
        { _id: admin._id.toString() },
        "365d"
      );
      const refreshToken = JWTService.signRefreshToken(
        { _id: admin._id.toString() },
        "365d"
      );

      await RefreshToken.updateOne(
        { adminId: admin._id },
        { token: refreshToken },
        { upsert: true }
      );

      await AccessToken.updateOne(
        { adminId: admin._id },
        { token: accessToken },
        { upsert: true }
      );

      // ✅ Remove password safely using destructuring
      const { password: _, ...adminSafe } = admin.toObject();

      return res
        .status(200)
        .json({ admin: adminSafe, auth: true, token: accessToken });
    } catch (err) {
      return next(err);
    }
  },

  // 🚪 LOGOUT
  async logout(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return next({ status: 401, message: "Unauthorized" });
    }

    const adminId = req.user._id as Types.ObjectId;
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader && authHeader.split(" ")[1];

    try {
      await RefreshToken.deleteOne({ adminId });
      await AccessToken.deleteOne({ token: accessToken });

      return res.status(200).json({ admin: null, auth: false });
    } catch (err) {
      return next(err);
    }
  },
  // 📝 GET ALL LOGINS
  async getAllAdmins(req: Request, res: Response, next: NextFunction) {
    try {
      const admins = await Admin.find({
        email: { $ne: "SuperAdmin@gmail.com" }, // Exclude SuperAdmin
      }).select(
        "adminId name email phoneNumber division area region strategy position image"
      ); // Include password & confirmPassword

      return res.status(200).json({ admins });
    } catch (err) {
      return next(err);
    }
  },
  async updateAdmin(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const {
      name,
      phoneNumber,
      email,
      password,
      confirmPassword,
      image,
      division,
      area,
      region,
      strategy,
      position,
    } = req.body;

    try {
      if (!Types.ObjectId.isValid(id)) {
        return next({ status: 400, message: "Invalid Account ID" });
      }

      const admin = await Admin.findById(id);
      if (!admin) {
        return next({ status: 404, message: "Account not found" });
      }

      // Update fields
      if (name) admin.name = name;
      if (phoneNumber) admin.phoneNumber = phoneNumber;
      if (email) admin.email = email;
      if (image) admin.image = image;
      if (division) admin.division = division;
      if (area) admin.area = area;
      if (region) admin.region = region;
      if (strategy) admin.strategy = strategy;
      if (position) admin.position = position;

      if (password) {
        if (password !== confirmPassword) {
          return next({ status: 400, message: "Passwords do not match" });
        }
        admin.password = await bcrypt.hash(password, 10);
      }

      const updatedAdmin = await admin.save();
      const { password: _, ...adminSafe } = updatedAdmin.toObject();

      return res.status(200).json({ admin: adminSafe });
    } catch (err) {
      return next(err);
    }
  },

  // 🗑️ DELETE ADMIN ACCOUNT
  async deleteAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const deletedAdmin = await Admin.findByIdAndDelete(req.params.id);

      if (!deletedAdmin) {
        res.status(404).json({ message: "Account not found" });
        return;
      }

      res.status(200).json({ message: "Account deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },
};

export default adminAuthController;
