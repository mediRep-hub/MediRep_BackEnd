import { Request, Response } from "express";
import Strategy from "../models/strategyModel";
import doctorModel from "../models/doctorModel";

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

    const enrichedStrategies = await Promise.all(
      strategies.map(async (strategy) => {
        const doctors = await doctorModel.find({
          name: { $in: strategy.doctorList },
        });

        // Preserve original order from strategy.doctorList
        const orderedDoctors = strategy.doctorList.map((name) =>
          doctors.find((doc) => doc.name === name)
        );

        return {
          ...strategy.toObject(),
          doctorList: orderedDoctors,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedStrategies.length,
      data: enrichedStrategies,
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

export const deleteStrategy = async (req: Request, res: Response) => {
  console.log("📦 Payload sent to server:");
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

// ✅ Update a strategy
export const updateStrategy = async (req: Request, res: Response) => {
  try {
    const strategy = await Strategy.findByIdAndUpdate(
      req.params.id,
      { doctorList: req.body.doctorList }, // save exactly as received
      { new: true }
    );

    if (!strategy) {
      return res
        .status(404)
        .json({ success: false, message: "Strategy not found" });
    }

    res.status(200).json({ success: true, data: strategy });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
