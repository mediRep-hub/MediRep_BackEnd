import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import JWTService from "../services/JWTService";
import RefreshToken from "../models/refreshToken";
import AccessToken from "../models/accessToken";
import Admin, { IAdmin } from "../models/admin";

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?/\\|-])[a-zA-Z\d!@#$%^&*()_+{}\[\]:;<>,.?/\\|-]{8,25}$/;

declare module "express" {
  interface Request {
    user?: any;
  }
}
interface AdminWithDistributor extends IAdmin {
  distributor?: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    phoneNumber: string;
    city: string;
    ownerName: string;
  } | null;
}
const adminAuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    // Validation schema
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
      division: Joi.string().required(), // e.g., Admin, Distributor, MR
      city: Joi.string().required(),
      position: Joi.string().required(),
      ownerName: Joi.string().when("division", {
        is: "Distributor",
        then: Joi.string().required().messages({
          "any.required": "Owner Name is required for Distributor",
        }),
        otherwise: Joi.string().allow(""), // <-- Fix
      }),
      brickName: Joi.string().when("division", {
        not: "Distributor", // if division is NOT Distributor
        then: Joi.string().required().messages({
          "any.required":
            "Brick Name is required for non-Distributor divisions",
        }),
        otherwise: Joi.string().optional().allow(""), // optional for Distributor
      }),
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
      city,
      brickName,
      position,
      ownerName,
    } = req.body;

    try {
      // Check if email exists
      const emailRegex = new RegExp(email, "i");
      const emailExists = await Admin.findOne({
        email: { $regex: emailRegex },
      });
      if (emailExists)
        return next({ status: 409, message: "Email already registered" });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate unique adminId
      const generateAdminId = async (position: string) => {
        const initials = position
          .split(" ")
          .map((word) => word[0].toUpperCase())
          .join("");

        let uniqueIdFound = false;
        let adminId = "";

        while (!uniqueIdFound) {
          const randomDigits = Math.floor(1000 + Math.random() * 9000);
          adminId = `${initials}-${randomDigits}`;
          const existing = await Admin.findOne({ adminId });
          if (!existing) uniqueIdFound = true;
        }

        return adminId;
      };

      const adminId = await generateAdminId(position);

      // Create admin object
      const adminToRegister = new Admin({
        adminId,
        name,
        phoneNumber,
        email,
        password: hashedPassword,
        image,
        division,
        city,
        brickName,
        position,
        ownerName,
      });

      // Automatically assign distributor if division = MR
      if (division === "MR") {
        const distributor = await Admin.findOne({
          division: "Distributor",
          city: city,
        });
        if (distributor) {
          (adminToRegister as any).distributor = distributor._id;
        }
      }

      const admin = await adminToRegister.save();

      // Generate JWT tokens
      const accessToken = JWTService.signAccessToken(
        { _id: admin._id.toString() },
        "365d",
      );
      const refreshToken = JWTService.signRefreshToken(
        { _id: admin._id.toString() },
        "365d",
      );

      await JWTService.storeRefreshToken(refreshToken, undefined, admin._id);
      await JWTService.storeAccessToken(accessToken, undefined, admin._id);

      // Remove password from response
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
      // Find admin by email
      const admin = await Admin.findOne({
        email: new RegExp(`^${email}$`, "i"),
      }).lean();

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

      // 🔑 Dynamically attach distributor if MR
      let distributorInfo = null;
      if (admin.position === "MedicalRep(MR)") {
        // Always fetch the distributor for the same city
        const distributor = await Admin.findOne({
          division: "Distributor",
          city: admin.city, // same city as MR
        })
          .select("name email phoneNumber city brickName position ownerName")
          .lean();

        if (distributor) distributorInfo = distributor;
      }

      // Generate tokens
      const accessToken = JWTService.signAccessToken(
        { _id: admin._id.toString() },
        "365d",
      );
      const refreshToken = JWTService.signRefreshToken(
        { _id: admin._id.toString() },
        "365d",
      );

      await RefreshToken.updateOne(
        { adminId: admin._id },
        { token: refreshToken },
        { upsert: true },
      );
      await AccessToken.updateOne(
        { adminId: admin._id },
        { token: accessToken },
        { upsert: true },
      );

      // Remove password
      const { password: _, ...adminSafe } = admin;

      // ✅ Attach distributor dynamically
      return res.status(200).json({
        admin: {
          ...adminSafe,
          distributor: distributorInfo, // this will show for all MRs in the same city
        },
        auth: true,
        token: accessToken,
      });
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
      // Parse page and limit from query params
      const page = parseInt(req.query.page as string) || 1; // default 1
      const limit = parseInt(req.query.limit as string) || 10; // default 10

      const skip = (page - 1) * limit;

      // Count total admins (excluding SuperAdmin)
      const totalItems = await Admin.countDocuments({
        email: { $ne: "SuperAdmin@gmail.com" },
      });

      // Fetch admins with pagination
      const admins = await Admin.find({
        email: { $ne: "SuperAdmin@gmail.com" },
      })
        .select(
          "adminId name email phoneNumber division ownerName brickName city position image",
        )
        .skip(skip)
        .limit(limit)
        .sort({ name: 1 }); // optional sorting

      return res.status(200).json({
        admins,
        pagination: {
          totalItems,
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          itemsPerPage: limit,
        },
      });
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
      city,
      brickName,
      position,
      ownerName,
    } = req.body;
    try {
      if (!Types.ObjectId.isValid(id)) {
        return next({ status: 400, message: "Invalid Account ID" });
      }

      const admin = await Admin.findById(id);
      if (!admin) {
        return next({ status: 404, message: "Account not found" });
      }

      // -----------------------------
      // Update normal fields
      // -----------------------------
      if (name) admin.name = name;
      if (phoneNumber) admin.phoneNumber = phoneNumber;
      if (email) admin.email = email;
      if (image) admin.image = image;
      if (city) admin.city = city;
      if (position) admin.position = position;

      // -----------------------------
      // Handle Division + OwnerName + BrickName Logic
      // -----------------------------
      if (division) {
        admin.division = division;

        if (division === "Distributor") {
          // Owner Name required for Distributor
          if (!ownerName) {
            return next({
              status: 400,
              message: "Owner Name is required for Distributor division",
            });
          }
          admin.ownerName = ownerName;

          // Brick Name is optional for Distributor
          admin.brickName = ""; // Clear brickName
        } else {
          // Owner Name cleared for non-Distributor
          admin.ownerName = "";

          // Brick Name required for non-Distributor
          if (!brickName) {
            return next({
              status: 400,
              message: "Brick Name is required for non-Distributor divisions",
            });
          }
          admin.brickName = brickName;
        }
      }

      // -----------------------------
      // Password Update
      // -----------------------------
      if (password) {
        if (password !== confirmPassword) {
          return next({ status: 400, message: "Passwords do not match" });
        }
        admin.password = await bcrypt.hash(password, 10);
      }

      // Save updated admin
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

  // Update password by admin ID (no old password required)
  async updatePassword(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params; // get id from URL
    const { password } = req.body; // get new password from body

    if (!password) {
      return next({ status: 400, message: "Password is required" });
    }

    // Use your existing password pattern
    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?/\\|-])[a-zA-Z\d!@#$%^&*()_+{}\[\]:;<>,.?/\\|-]{8,25}$/;

    if (!passwordPattern.test(password)) {
      return next({
        status: 400,
        message:
          "Password must include 1 uppercase, 1 special character, 1 digit, 8-25 characters long",
      });
    }

    try {
      const admin = await Admin.findById(id);
      if (!admin) return next({ status: 404, message: "Admin not found" });

      admin.password = await bcrypt.hash(password, 10);
      await admin.save();

      return res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
      return next(err);
    }
  },
};

export default adminAuthController;
