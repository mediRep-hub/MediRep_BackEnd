import CallReporting from "../models/callReportingModel";
import Doctor from "../models/doctorModel";

// Create / Add call report
export const addCallReport = async (req, res) => {
  try {
    const { mrName, doctorList, ...rest } = req.body;

    // Optional: validate doctorList
    let doctors = [];
    if (doctorList && doctorList.length > 0) {
      doctors = await Doctor.find({ _id: { $in: doctorList } });
    }

    const newReport = await CallReporting.create({
      mrName,
      doctorList: doctors.map((d) => d._id),
      ...rest,
    });

    res.status(201).json({ success: true, data: newReport });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch all call reports
export const getAllCallReports = async (req, res) => {
  try {
    const reports = await CallReporting.find().populate("doctorList");
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update call report
export const updateCallReport = async (req, res) => {
  try {
    const { id } = req.params; // call report ID
    const { doctorList, ...rest } = req.body;

    // Optional: validate doctorList
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

    if (!updatedReport) {
      return res
        .status(404)
        .json({ success: false, message: "Call report not found" });
    }

    res.status(200).json({ success: true, data: updatedReport });
  } catch (error) {
    console.error("Error updating call report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Delete call report
export const deleteCallReport = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedReport = await CallReporting.findByIdAndDelete(id);

    if (!deletedReport) {
      return res
        .status(404)
        .json({ success: false, message: "Call report not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Call report deleted successfully" });
  } catch (error) {
    console.error("Error deleting call report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get single call report by ID
export const getCallReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await CallReporting.findById(id).populate("doctorList");

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Call report not found" });
    }

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("Error fetching call report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
