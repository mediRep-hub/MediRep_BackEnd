import CallReporting from "../models/brickModel";
import Doctor from "../models/doctorModel";
import Admin from "../models/admin";
import mongoose from "mongoose";
import { Request, Response } from "express";
import {
  validateAddCallReport,
  validateCheckLocation,
} from "../validations/brickValidation";

interface CheckLocationBody {
  callReportId: string;
  doctorId: string;
  lat: number;
  lng: number;
}

// ✅ Add / Create call report
export const addBrick = async (req, res) => {
  const { error } = validateAddCallReport(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.message).join(", "),
    });
  }
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

// 🟢 Get all call reports with pagination
export const getAllBricks = async (req: Request, res: Response) => {
  try {
    const {
      mrName,
      area,
      date,
      startDate,
      endDate,
      page = "1",
      limit = "10",
      doctorPage = "1",
      doctorLimit = "10",
    } = req.query;

    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;

    const docPageNumber = parseInt(doctorPage as string, 10) || 1;
    const docPageSize = parseInt(doctorLimit as string, 10) || 10;

    const skip = (pageNumber - 1) * pageSize;

    let filter: any = {};
    if (mrName && mrName !== "All") {
      if (mongoose.Types.ObjectId.isValid(mrName as string)) {
        filter.mrName = mrName;
      } else {
        const mr = await Admin.findOne({
          name: mrName,
          position: "MedicalRep(MR)",
        });

        if (!mr) {
          return res.status(404).json({
            success: false,
            message: "MR not found",
          });
        }

        filter.mrName = mr._id;
      }
    }
    if (area && area !== "All") {
      filter.area = area;
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
    const totalReports = await CallReporting.countDocuments(filter);
    const reports = await CallReporting.find(filter)
      .populate("doctorList.doctor")
      .populate("mrName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);
    const reportsWithPaginatedDoctors = reports.map((report) => {
      const totalCalls = report.doctorList.length;
      const completedCalls = report.doctorList.filter(
        (doc) => doc.status === "close"
      ).length;

      const doctorSkip = (docPageNumber - 1) * docPageSize;
      const paginatedDoctors = report.doctorList.slice(
        doctorSkip,
        doctorSkip + docPageSize
      );

      return {
        ...report.toObject(),
        mrStatus: { totalCalls, completedCalls },
        doctorList: paginatedDoctors,
        doctorPagination: {
          page: docPageNumber,
          totalItems: totalCalls,
          totalPages: Math.ceil(totalCalls / docPageSize),
          limit: docPageSize,
        },
      };
    });

    res.status(200).json({
      success: true,
      page: pageNumber,
      totalPages: Math.ceil(totalReports / pageSize),
      totalItems: totalReports,
      data: reportsWithPaginatedDoctors,
    });
  } catch (error: any) {
    console.error("GetAllCallReports Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// ✅ Delete call report by ID
export const deleteBrick = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedReport = await CallReporting.findByIdAndDelete(id);

    if (!deletedReport)
      return res
        .status(404)
        .json({ success: false, message: "Brick not found" });

    res
      .status(200)
      .json({ success: true, message: "Brick deleted successfully" });
  } catch (error) {
    console.error("Error deleting call report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// ✅ Update call report by ID

export const updateBrick = async (req, res) => {
  const { error } = validateAddCallReport(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.message).join(", "),
    });
  }
  try {
    const { id } = req.params;
    const { doctorList: incomingDoctors } = req.body;

    if (
      !incomingDoctors ||
      !Array.isArray(incomingDoctors) ||
      incomingDoctors.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "No doctor data provided." });
    }

    const callReport = await CallReporting.findById(id);
    if (!callReport) {
      return res
        .status(404)
        .json({ success: false, message: "Brick not found" });
    }
    const existingDoctorIds = callReport.doctorList.map((d) =>
      d.doctor.toString()
    );

    incomingDoctors.forEach((doc) => {
      const doctorId = doc.doctor;
      const index = existingDoctorIds.indexOf(doctorId);

      if (index > -1) {
        Object.assign(callReport.doctorList[index], doc);
      } else {
        callReport.doctorList.push(
          CallReporting.prepareDoctorList([doctorId])[0]
        );
      }
    });

    await callReport.save();
    await callReport.populate("doctorList.doctor");

    res.status(200).json({ success: true, data: callReport });
  } catch (error) {
    console.error("Error updating Brick doctors:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update the order of doctors in a call report

export const reorderDoctorList = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderedDoctorIds } = req.body;
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
        .json({ success: false, message: "Brick not found." });
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

function getDistanceFromLatLonInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const checkDoctorLocation = async (
  req: Request<{}, {}, CheckLocationBody>,
  res: Response
) => {
  const { error: locError } = validateCheckLocation(req.body);
  if (locError) {
    return res.status(400).json({
      success: false,
      message: locError.details.map((d) => d.message).join(", "),
    });
  }
  try {
    const { callReportId, doctorId, lat, lng } = req.body;

    if (!callReportId || !doctorId || lat === undefined || lng === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const callReport = await CallReporting.findById(callReportId).populate(
      "doctorList.doctor"
    );

    if (!callReport) {
      return res
        .status(404)
        .json({ success: false, message: "Brick not found" });
    }

    const doctorEntry = callReport.doctorList.find(
      (d) => d.doctor._id.toString() === doctorId
    );

    if (!doctorEntry) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found in Brick" });
    }

    const doctorLat = (doctorEntry.doctor as any).location.lat;
    const doctorLng = (doctorEntry.doctor as any).location.lng;

    const distance = getDistanceFromLatLonInMeters(
      lat,
      lng,
      doctorLat,
      doctorLng
    );

    if (distance <= 500) {
      return res
        .status(200)
        .json({ success: true, message: "Location is match", distance });
    } else {
      return res
        .status(200)
        .json({ success: false, message: "Location is not match", distance });
    }
  } catch (error: any) {
    console.error("Error checking location:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
