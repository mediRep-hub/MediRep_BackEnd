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

// Fetch call reports for a specific MR
export const getCallReportsForMR = async (req, res) => {
  try {
    const { mrName } = req.params;
    const reports = await CallReporting.find({ mrName }).populate("doctorList");
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
