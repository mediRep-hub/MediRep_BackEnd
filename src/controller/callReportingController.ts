import { Request, Response } from "express";
import { CallReport } from "../models/callReportingModel";

// Utility: Generate unique Call ID
const generateCallId = async (): Promise<string> => {
  const lastReport = await CallReport.findOne().sort({ createdAt: -1 });
  let newIdNumber = 1;

  if (lastReport?.callId) {
    const lastIdNumber = parseInt(lastReport.callId.split("-")[1]);
    if (!isNaN(lastIdNumber)) {
      newIdNumber = lastIdNumber + 1;
    }
  }

  return `CALL-${newIdNumber.toString().padStart(4, "0")}`;
};

// Add new call report
export const addCallReport = async (req: Request, res: Response) => {
  try {
    const newCallId = await generateCallId();

    const {
      mrName,
      doctorName,
      doctorAddress,
      strategyName,
      date,
      checkIn,
      checkOut,
      duration,
      productDiscussed,
      doctorResponse,
      promotionalMaterialGiven,
      followUpRequired = false,
      doctorPurchaseInterest,
      keyDiscussionPoints,
      doctorConcerns,
      area,
      checkInLocation,
    } = req.body;

    const newReport = new CallReport({
      callId: newCallId,
      mrName,
      doctorName,
      doctorAddress,
      strategyName,
      date,
      checkIn,
      checkOut,
      duration,
      productDiscussed,
      doctorResponse,
      promotionalMaterialGiven,
      followUpRequired,
      doctorPurchaseInterest,
      keyDiscussionPoints,
      doctorConcerns,
      area,
      checkInLocation,
    });

    await newReport.save();

    res
      .status(201)
      .json({ message: "Call report added successfully", data: newReport });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error adding call report", error: error.message });
  }
};

// Get all call reports (with optional filtering)
export const getAllCallReports = async (req: Request, res: Response) => {
  try {
    const { mrName, startDate, endDate, area } = req.query;
    const filter: any = {};

    if (mrName) filter.mrName = mrName;
    if (area) filter.area = area;
    if (startDate || endDate) filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate as string);
    if (endDate) filter.date.$lte = new Date(endDate as string);

    const reports = await CallReport.find(filter).sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching call reports", error: error.message });
  }
};

// Get single report by ID
export const getCallReportById = async (req: Request, res: Response) => {
  try {
    const report = await CallReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.status(200).json(report);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching report", error: error.message });
  }
};

// Update report (partial updates only)
export const updateCallReport = async (req: Request, res: Response) => {
  try {
    const allowedUpdates = [
      "mrName",
      "doctorName",
      "doctorAddress",
      "strategyName",
      "date",
      "checkIn",
      "checkOut",
      "duration",
      "productDiscussed",
      "doctorResponse",
      "promotionalMaterialGiven",
      "followUpRequired",
      "doctorPurchaseInterest",
      "keyDiscussionPoints",
      "doctorConcerns",
      "area",
      "checkInLocation",
    ];

    const updates: any = {};
    allowedUpdates.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const updatedReport = await CallReport.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!updatedReport) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json({
      message: "Call report updated successfully",
      data: updatedReport,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error updating report", error: error.message });
  }
};

// Delete report
export const deleteCallReport = async (req: Request, res: Response) => {
  try {
    const deletedReport = await CallReport.findByIdAndDelete(req.params.id);
    if (!deletedReport) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.status(200).json({ message: "Call report deleted successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error deleting report", error: error.message });
  }
};
