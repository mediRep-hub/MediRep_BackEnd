import { Request, Response, NextFunction } from "express";
import Requisition, { IRequisition } from "../models/requisitionModel";
import Doctor from "../models/doctorModel";

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
export const addRequisition = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      mrName,
      doctor,
      doctorName,
      attachedDoc,
      details,
      product,
      startingDate,
      quantity,
      duration,
      amount,
      paymentType,
      remarks,
    } = req.body;

    const reqId = await generateReqId();

    const newRequisition = new Requisition({
      reqId,
      mrName,
      doctor,
      doctorName,
      attachedDoc,
      details,
      product,
      startingDate,
      quantity,
      duration,
      amount,
      paymentType,
      remarks: remarks || undefined,
      accepted: false,
      status: "Pending",
    });

    const savedRequisition = await newRequisition.save();

    return res.status(201).json({
      success: true,
      message: "Requisition created successfully",
      requisition: savedRequisition,
    });
  } catch (error) {
    console.error("Error adding requisition:", error);
    return next(error);
  }
};

// Get all requisitions
export const getAllRequisitions = async (req: Request, res: Response) => {
  try {
    const requisitions = await Requisition.find().populate(
      "doctor",
      "name image specialty"
    );
    res.status(200).json(requisitions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const getSingleRequisition = async (req: Request, res: Response) => {
  try {
    const requisition = await Requisition.findById(req.params.id);
    if (!requisition) return res.status(404).json({ error: "Not found" });
    res.status(200).json(requisition);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateRequisition = async (req: Request, res: Response) => {
  try {
    const allowedFields = [
      "status",
      "duration",
      "quantity",
      "paymentType",
      "amount",
      "remarks",
    ];
    const updates: any = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedReq = await Requisition.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!updatedReq)
      return res.status(404).json({ error: "Requisition not found" });

    res.status(200).json({
      success: true,
      message: "Requisition updated successfully",
      requisition: updatedReq,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Delete requisition
export const deleteRequisition = async (req: Request, res: Response) => {
  try {
    const deletedReq = await Requisition.findByIdAndDelete(req.params.id);
    if (!deletedReq) return res.status(404).json({ error: "Not found" });
    res.status(200).json({ message: "Requisition deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAccepted = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const updatedRequisition = await Requisition.findByIdAndUpdate(
      id,
      { accepted: true },
      { new: true } // return the updated document
    );

    if (!updatedRequisition) {
      return res.status(404).json({ error: "Requisition not found" });
    }

    res
      .status(200)
      .json({ message: "Requisition accepted", data: updatedRequisition });
  } catch (error: any) {
    console.error("Error updating accepted:", error);
    res.status(500).json({ error: "Server error" });
  }
};
