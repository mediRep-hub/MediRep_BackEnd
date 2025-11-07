import { Request, Response } from "express";
import mongoose from "mongoose";
import Strategy from "../models/strategyModel";
import doctorModel from "../models/doctorModel";

// ✅ Add Strategy
export const addStrategy = async (req: Request, res: Response) => {
  try {
    const { mrId, doctorList } = req.body;

    if (!mrId || !mongoose.Types.ObjectId.isValid(mrId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing MR ID",
      });
    }

    const newStrategy = new Strategy({
      ...req.body,
      doctorList: doctorList || [],
    });

    await newStrategy.save();

    res.status(201).json({
      success: true,
      message: "Strategy added successfully",
      data: newStrategy,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add strategy",
    });
  }
};

// ✅ Get all strategies (filter by MR if mrId is provided)
export const getAllStrategies = async (req: Request, res: Response) => {
  try {
    // Read mrName either from token or query
    const mrNameFromToken = req.user?.name;
    const mrNameFromQuery = req.query.mrName as string;

    // Use query first (if provided), otherwise token name
    const mrName = mrNameFromQuery || mrNameFromToken;

    // If mrName exists, filter by it — otherwise get all
    const filter = mrName ? { mrName } : {};

    const strategies = await Strategy.find(filter);

    if (!strategies.length) {
      return res.status(404).json({
        success: false,
        message: "No strategies found",
      });
    }

    res.status(200).json({
      success: true,
      count: strategies.length,
      data: strategies,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Get single strategy
export const getStrategyById = async (req: Request, res: Response) => {
  try {
    const strategy = await Strategy.findById(req.params.id);
    if (!strategy) {
      return res
        .status(404)
        .json({ success: false, message: "Strategy not found" });
    }

    res.status(200).json({ success: true, data: strategy });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch strategy",
    });
  }
};

// ✅ Update strategy
export const updateStrategy = async (req: Request, res: Response) => {
  try {
    const { doctorList, mrId, ...rest } = req.body;

    if (mrId && !mongoose.Types.ObjectId.isValid(mrId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid MR ID",
      });
    }

    const strategy = await Strategy.findByIdAndUpdate(
      req.params.id,
      {
        ...rest,
        ...(doctorList ? { doctorList } : {}),
        ...(mrId ? { mrId } : {}),
      },
      { new: true }
    );

    if (!strategy) {
      return res
        .status(404)
        .json({ success: false, message: "Strategy not found" });
    }

    res.status(200).json({ success: true, data: strategy });
  } catch (error: any) {
    console.error("❌ Error in updateStrategy:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete strategy
export const deleteStrategy = async (req: Request, res: Response) => {
  try {
    const deleted = await Strategy.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Strategy not found" });
    }

    res.status(200).json({
      success: true,
      message: "Strategy deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error in deleteStrategy:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete strategy",
    });
  }
};
