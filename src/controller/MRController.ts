import { Request, Response } from "express";
import MR from "../models/MRModel";
import bcrypt from "bcryptjs";

// ✅ Helper function to generate unique MR ID
const generateMRId = async (): Promise<string> => {
  let unique = false;
  let mrId = "";

  while (!unique) {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random
    mrId = `ME-${randomNum}`;
    const existingMR = await MR.findOne({ mrId });
    if (!existingMR) unique = true;
  }

  return mrId;
};

// 🔹 Create MR
export const createMR = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mrName, phoneNo, region, area, strategy, password, image } =
      req.body;

    // Validate required fields
    if (
      !mrName ||
      !phoneNo ||
      !region ||
      !area ||
      !strategy ||
      !password ||
      !image
    ) {
      res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
      return;
    }

    const existing = await MR.findOne({ phoneNo });
    if (existing) {
      res.status(400).json({
        success: false,
        message: "MR with this phone number already exists.",
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique MR ID
    const mrId = await generateMRId();

    // Create new MR
    const newMR = new MR({
      mrId,
      mrName,
      phoneNo,
      region,
      area,
      strategy,
      image,
      password: hashedPassword,
    });

    await newMR.save();

    res.status(201).json({
      success: true,
      message: "MR created successfully",
      data: newMR,
    });
  } catch (error: any) {
    console.error("❌ Error creating MR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while creating MR",
      error: error.message,
    });
  }
};

// ✅ Get All MRs
export const getAllMRs = async (req: Request, res: Response): Promise<void> => {
  try {
    const mrs = await MR.find().sort({ createdAt: -1 });
    res.status(200).json(mrs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMRById = async (req: Request, res: Response): Promise<void> => {
  try {
    const mr = await MR.findById(req.params.id);
    if (!mr) {
      res.status(404).json({ message: "MR not found" });
      return;
    }
    res.status(200).json(mr);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update MR
export const updateMR = async (req: Request, res: Response): Promise<void> => {
  try {
    const { password, confirmPassword, ...rest } = req.body;
    let updateData = { ...rest };

    // If updating password
    if (password) {
      if (password !== confirmPassword) {
        res.status(400).json({ message: "Passwords do not match" });
        return;
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedMR = await MR.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!updatedMR) {
      res.status(404).json({ message: "MR not found" });
      return;
    }

    res.status(200).json({
      message: "MR updated successfully",
      updatedMR,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete MR
export const deleteMR = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedMR = await MR.findByIdAndDelete(req.params.id);
    if (!deletedMR) {
      res.status(404).json({ message: "MR not found" });
      return;
    }
    res.status(200).json({ message: "MR deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
