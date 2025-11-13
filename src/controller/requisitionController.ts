import { Request, Response } from "express";
import Requisition, { IRequisition } from "../models/requisitionModel";
import Doctor from "../models/doctorModel";

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

// Add a new requisition
export const addRequisition = async (req: Request, res: Response) => {
  try {
    const reqId = await generateReqId();

    // Calculate total amount from all products
    const totalAmount =
      req.body.product?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

    const newReq = new Requisition({
      ...req.body,
      reqId,
      amount: totalAmount,
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

// Get all requisitions
export const getAllRequisitions = async (req: Request, res: Response) => {
  try {
    const requisitions = await Requisition.find().populate(
      "doctor",
      "name image specialty"
    );
    res.status(200).json({ success: true, requisitions });
  } catch (err: any) {
    console.error("Get All Requisitions Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get single requisition
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

// Update requisition
export const updateRequisition = async (req: Request, res: Response) => {
  try {
    const allowedFields = ["status", "paymentType", "remarks", "product"];

    const updates: any = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Recalculate total amount if products are updated
    if (updates.product && Array.isArray(updates.product)) {
      updates.amount = updates.product.reduce(
        (sum: number, p: any) => sum + p.amount,
        0
      );
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

// Delete requisition
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

// Update accepted status
export const updateAccepted = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const updatedRequisition = await Requisition.findByIdAndUpdate(
      id,
      { accepted: true },
      { new: true }
    ).populate("doctor", "name image specialty");

    if (!updatedRequisition) {
      return res.status(404).json({ error: "Requisition not found" });
    }

    res.status(200).json({
      success: true,
      message: "Requisition accepted",
      data: updatedRequisition,
    });
  } catch (error: any) {
    console.error("Update Accepted Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
