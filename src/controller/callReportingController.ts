import { Request, Response } from "express";
import { CallReport } from "../models/callReportingModel";

const generateCallId = async (): Promise<string> => {
  const lastReport = await CallReport.findOne().sort({ createdAt: -1 });
  let newIdNumber = 1;

  if (lastReport && lastReport.callId) {
    const lastIdNumber = parseInt(lastReport.callId.split("-")[1]);
    if (!isNaN(lastIdNumber)) {
      newIdNumber = lastIdNumber + 1;
    }
  }

  return `CALL-${newIdNumber.toString().padStart(4, "0")}`;
};

// Add new call report (auto-generated callId)
export const addCallReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const newCallId = await generateCallId();

    const newReport = new CallReport({
      ...req.body,
      callId: newCallId,
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

// Get all call reports
export const getAllCallReports = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const reports = await CallReport.find().sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching call reports", error: error.message });
  }
};

// Get single report by ID
export const getCallReportById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const report = await CallReport.findById(req.params.id);
    if (!report) {
      res.status(404).json({ message: "Report not found" });
      return;
    }
    res.status(200).json(report);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching report", error: error.message });
  }
};

// Update report
export const updateCallReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const updatedReport = await CallReport.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedReport) {
      res.status(404).json({ message: "Report not found" });
      return;
    }

    res
      .status(200)
      .json({ message: "Call report updated", data: updatedReport });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error updating report", error: error.message });
  }
};

// Delete report
export const deleteCallReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deletedReport = await CallReport.findByIdAndDelete(req.params.id);
    if (!deletedReport) {
      res.status(404).json({ message: "Report not found" });
      return;
    }
    res.status(200).json({ message: "Call report deleted successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error deleting report", error: error.message });
  }
};
