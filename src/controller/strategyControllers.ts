import { Request, Response } from "express";
import Strategy from "../models/strategyModel";

export const addStrategy = async (req: Request, res: Response) => {
  try {
    const newStrategy = new Strategy(req.body);
    await newStrategy.save();

    res.status(201).json({
      success: true,
      message: "Strategy added successfully",
      data: newStrategy,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add strategy",
    });
  }
};

// ✅ Get all strategies
export const getAllStrategies = async (req: Request, res: Response) => {
  try {
    const strategies = await Strategy.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: strategies.length,
      data: strategies,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch strategies",
    });
  }
};

// ✅ Get single strategy
export const getStrategyById = async (req: Request, res: Response) => {
  try {
    const strategy = await Strategy.findById(req.params.id);
    if (!strategy)
      return res
        .status(404)
        .json({ success: false, message: "Strategy not found" });

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
    const updated = await Strategy.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Strategy not found" });

    res.status(200).json({
      success: true,
      message: "Strategy updated successfully",
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update strategy",
    });
  }
};

// ✅ Delete strategy
export const deleteStrategy = async (req: Request, res: Response) => {
  try {
    const deleted = await Strategy.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Strategy not found" });

    res.status(200).json({
      success: true,
      message: "Strategy deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete strategy",
    });
  }
};
