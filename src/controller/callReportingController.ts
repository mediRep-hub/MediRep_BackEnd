import CallReporting from "../models/callReportingModel";
import Doctor from "../models/doctorModel";
import Admin from "../models/admin";
import mongoose from "mongoose";

import { v4 as uuidv4 } from "uuid";

// ✅ Add / Create call report
export const addCallReport = async (req, res) => {
  try {
    const { mrName, doctorList, ...rest } = req.body;

    // Validate MR
    const mrs = mongoose.Types.ObjectId.isValid(mrName)
      ? await Admin.find({ _id: mrName, position: "MedicalRep(MR)" })
      : await Admin.find({ name: mrName, position: "MedicalRep(MR)" });

    if (!mrs.length)
      return res.status(404).json({ success: false, message: "MR not found" });

    const mr = mrs[0];

    // Validate doctors
    const validDoctorIds = doctorList.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (!validDoctorIds.length)
      return res
        .status(400)
        .json({ success: false, message: "Invalid doctor IDs" });

    const doctors = await Doctor.find({ _id: { $in: validDoctorIds } });
    if (!doctors.length)
      return res
        .status(404)
        .json({ success: false, message: "No doctors found" });

    // Map doctorList (callId auto-generated in schema)
    const formattedDoctorList = doctors.map((doc) => ({
      doctor: doc._id,
      status: "pending", // optional
    }));

    const report = new CallReporting({
      mrName: mr._id,
      doctorList: formattedDoctorList,
      ...rest,
    });

    await report.save();
    return res.status(201).json({ success: true, data: report });
  } catch (error) {
    console.error("AddCallReport Error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

export const getAllCallReports = async (req, res) => {
  try {
    const { mrName } = req.query; // Get MR name or ID from query

    let filter: any = {};

    if (mrName) {
      // Check if mrName is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(mrName)) {
        filter.mrName = mrName;
      } else {
        // If not ObjectId, find MR by name
        const mr = await Admin.findOne({
          name: mrName,
          position: "MedicalRep(MR)",
        });
        if (!mr) {
          return res
            .status(404)
            .json({ success: false, message: "MR not found" });
        }
        filter.mrName = mr._id;
      }
    }

    const reports = await CallReporting.find(filter)
      .populate("doctorList.doctor")
      .populate("mrName");

    const reportsWithStatus = reports.map((report) => {
      const totalCalls = report.doctorList.length;
      const completedCalls = report.doctorList.filter(
        (doc) => doc.status === "close"
      ).length;

      return {
        ...report.toObject(),
        mrStatus: { totalCalls, completedCalls },
      };
    });

    res.status(200).json({ success: true, data: reportsWithStatus });
  } catch (error) {
    console.error("GetAllCallReports Error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

// ✅ Delete call report by ID
export const deleteCallReport = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedReport = await CallReporting.findByIdAndDelete(id);

    if (!deletedReport)
      return res
        .status(404)
        .json({ success: false, message: "Call report not found" });

    res
      .status(200)
      .json({ success: true, message: "Call report deleted successfully" });
  } catch (error) {
    console.error("Error deleting call report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// ✅ Update call report by ID

export const updateCallReport = async (req, res) => {
  try {
    const { id } = req.params; // CallReporting _id
    const { doctorList: incomingDoctors } = req.body; // array of doctors to add/update

    if (
      !incomingDoctors ||
      !Array.isArray(incomingDoctors) ||
      incomingDoctors.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "No doctor data provided." });
    }

    // Find the main call report
    const callReport = await CallReporting.findById(id);
    if (!callReport) {
      return res
        .status(404)
        .json({ success: false, message: "Call report not found" });
    }

    // Convert existing doctor IDs to strings for comparison
    const existingDoctorIds = callReport.doctorList.map((d) =>
      d.doctor.toString()
    );

    incomingDoctors.forEach((doc) => {
      const doctorId = doc.doctor; // should be ObjectId or string
      const index = existingDoctorIds.indexOf(doctorId);

      if (index > -1) {
        // Doctor exists -> update fields
        Object.assign(callReport.doctorList[index], doc);
      } else {
        // Doctor does not exist -> add as new subdocument
        callReport.doctorList.push(
          CallReporting.prepareDoctorList([doctorId])[0]
        );
      }
    });

    // Save the updated call report
    await callReport.save();

    // Populate doctor data for response
    await callReport.populate("doctorList.doctor");

    res.status(200).json({ success: true, data: callReport });
  } catch (error) {
    console.error("Error updating call report doctors:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update the order of doctors in a call report
// backend/controllers/callReporting.ts

export const reorderDoctorList = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderedDoctorIds } = req.body;

    // Validate input
    if (
      !orderedDoctorIds ||
      !Array.isArray(orderedDoctorIds) ||
      orderedDoctorIds.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "No doctor IDs provided." });
    }

    const callReport = await CallReporting.findById(id);
    if (!callReport) {
      return res
        .status(404)
        .json({ success: false, message: "Call report not found." });
    }

    const doctorMap = new Map(
      callReport.doctorList.map((d) => [d.doctor.toString(), d])
    );

    const reorderedList = orderedDoctorIds
      .map((docId) => doctorMap.get(docId))
      .filter(Boolean);

    if (reorderedList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor IDs. No reorder performed.",
      });
    }
    callReport.doctorList.splice(
      0,
      callReport.doctorList.length,
      ...reorderedList
    );

    await callReport.save();
    await callReport.populate("doctorList.doctor");

    res.status(200).json({ success: true, data: callReport });
  } catch (error) {
    console.error("Error reordering doctor list:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
