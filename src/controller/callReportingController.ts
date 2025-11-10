import CallReporting from "../models/callReportingModel.js";
import Doctor from "../models/doctorModel.js";

// ✅ Add / Create call report
export const addCallReport = async (req, res) => {
  try {
    const { doctorList, ...rest } = req.body;

    // Validate doctorList and convert to ObjectId
    let doctors = [];
    if (doctorList && doctorList.length > 0) {
      doctors = await Doctor.find({ _id: { $in: doctorList } });
    }

    const newReport = await CallReporting.create({
      ...rest,
      doctorList: doctors.map((d) => d._id),
    });

    res.status(201).json({ success: true, data: newReport });
  } catch (error) {
    console.error("Error creating call report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all call reports
export const getAllCallReports = async (req, res) => {
  try {
    const reports = await CallReporting.find().populate("doctorList");
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    console.error("Error fetching call reports:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get single call report by ID
export const getCallReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await CallReporting.findById(id).populate("doctorList");
    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Call report not found" });

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("Error fetching call report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get call reports for a specific MR
export const getCallReportsForMR = async (req, res) => {
  try {
    const { mrName } = req.params;

    const reports = await CallReporting.find({ mrName }).populate("doctorList");
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    console.error("Error fetching reports for MR:", error);
    res.status(500).json({ success: false, message: error.message });
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
