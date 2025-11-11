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
      .populate("doctorList.doctor", "name") // Populate doctors with name only
      .populate("mrName"); // Populate full MR details

    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    console.error("GetAllCallReports Error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

// ✅ Update call report by ID
export const updateCallReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorList, ...rest } = req.body;

    // Validate doctorList
    let doctors = [];
    if (doctorList && doctorList.length > 0) {
      doctors = await Doctor.find({ _id: { $in: doctorList } });
    }

    const updatedReport = await CallReporting.findByIdAndUpdate(
      id,
      {
        ...rest,
        ...(doctors.length > 0 && { doctorList: doctors.map((d) => d._id) }),
      },
      { new: true, runValidators: true }
    ).populate("doctorList");

    if (!updatedReport)
      return res
        .status(404)
        .json({ success: false, message: "Call report not found" });

    res.status(200).json({ success: true, data: updatedReport });
  } catch (error) {
    console.error("Error updating call report:", error);
    res.status(500).json({ success: false, message: error.message });
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
