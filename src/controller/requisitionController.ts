import { Request, Response } from "express";
import Requisition from "../models/requisitionModel";
import Doctor from "../models/doctorModel";
import Admin from "../models/admin";
import mongoose from "mongoose";
import { validateRequisitionData } from "../validations/requistionsValidation";

// Generate unique reqId
const generateReqId = async () => {
  let unique = false;
  let reqId = "";

  while (!unique) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    reqId = `REQ-${randomDigits}`;

    const existing = await Requisition.findOne({ reqId });
    if (!existing) unique = true;
  }

  return reqId;
};

// Helper: calculate totals
const calculateTotals = (products: any[] = []) => {
  const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
  return { totalQuantity };
};

// 🟢 Add a new requisition
export const addRequisition = async (req: Request, res: Response) => {
  const { error } = validateRequisitionData(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.message).join(", "),
    });
  }
  try {
    const reqId = await generateReqId();
    if (req.body.requisitionType === "Cash" && !req.body.amount) {
      return res
        .status(400)
        .json({ error: "Amount is required for Cash type" });
    }

    const { totalQuantity } = calculateTotals(req.body.product);

    const newReq = new Requisition({
      ...req.body,
      reqId,
      totalQuantity,
    });

    const savedReq = await newReq.save();
    await savedReq.populate("doctor", "name image specialty");

    res.status(201).json({
      success: true,
      message: "Requisition added successfully",
      requisition: savedReq,
    });
  } catch (err: any) {
    console.error("Add Requisition Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllRequisitions = async (req: Request, res: Response) => {
  try {
    const {
      mrName,
      date,
      startDate,
      endDate,
      page = "1",
      limit = "10",
    } = req.query;

    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    let filter: any = {};
    if (mrName && mrName !== "All") {
      filter.$or = [
        { mrName: mrName },
        {
          mrName: {
            $in: (
              await Admin.find({ name: { $regex: mrName, $options: "i" } })
            ).map((m) => m._id),
          },
        },
      ];
    }
    if (date) {
      const dayStart = new Date(date as string);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date as string);
      dayEnd.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: dayStart, $lte: dayEnd };
    }

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }
    const total = await Requisition.countDocuments(filter);
    const requisitions = await Requisition.find(filter)
      .populate("doctor", "name image specialty")
      .populate("mrName", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);
    res.status(200).json({
      success: true,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize),
      totalItems: total,
      requisitions,
    });
  } catch (err: any) {
    console.error("Get All Requisitions Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getSingleRequisition = async (req: Request, res: Response) => {
  try {
    const requisition = await Requisition.findById(req.params.id).populate(
      "doctor",
      "name image specialty"
    );
    if (!requisition)
      return res.status(404).json({ error: "Requisition not found" });
    res.status(200).json({ success: true, requisition });
  } catch (err: any) {
    console.error("Get Single Requisition Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🟢 Update requisition
export const updateRequisition = async (req: Request, res: Response) => {
  try {
    const allowedFields = [
      "status",
      "paymentType",
      "remarks",
      "product",
      "amount",
      "requisitionType",
    ];
    const updates: any = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    if (updates.requisitionType === "Cash" && !updates.amount) {
      return res
        .status(400)
        .json({ error: "Amount is required for Cash type" });
    }
    if (updates.product && Array.isArray(updates.product)) {
      const { totalQuantity } = calculateTotals(updates.product);
      updates.totalQuantity = totalQuantity;
    }

    const updatedReq = await Requisition.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate("doctor", "name image specialty");

    if (!updatedReq)
      return res.status(404).json({ error: "Requisition not found" });

    res.status(200).json({
      success: true,
      message: "Requisition updated successfully",
      requisition: updatedReq,
    });
  } catch (err: any) {
    console.error("Update Requisition Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🟢 Delete requisition
export const deleteRequisition = async (req: Request, res: Response) => {
  try {
    const deletedReq = await Requisition.findByIdAndDelete(req.params.id);
    if (!deletedReq)
      return res.status(404).json({ error: "Requisition not found" });

    res
      .status(200)
      .json({ success: true, message: "Requisition deleted successfully" });
  } catch (err: any) {
    console.error("Delete Requisition Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🟢 Update updateStatus status
export const updateStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // "accepted" or "rejected"

  // Validate status
  if (!["accepted", "rejected"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status value",
    });
  }

  try {
    const updated = await Requisition.findByIdAndUpdate(
      id,
      {
        status, // status update
        accepted: status === "accepted", // boolean field update
      },
      { new: true }
    ).populate("doctor", "name image specialty");

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Requisition not found" });
    }

    res.status(200).json({
      success: true,
      message: `Requisition ${status}`,
      data: updated,
    });
  } catch (error: any) {
    console.error("Update Status Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
