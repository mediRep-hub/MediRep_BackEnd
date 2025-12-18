"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDoctorLocation = exports.reorderDoctorList = exports.updateBrick = exports.deleteBrick = exports.getAllBricks = exports.addBrick = void 0;
const brickModel_1 = __importDefault(require("../models/brickModel"));
const doctorModel_1 = __importDefault(require("../models/doctorModel"));
const admin_1 = __importDefault(require("../models/admin"));
const mongoose_1 = __importDefault(require("mongoose"));
// ✅ Add / Create call report
const addBrick = async (req, res) => {
    try {
        const { mrName, doctorList, ...rest } = req.body;
        // Validate MR
        const mrs = mongoose_1.default.Types.ObjectId.isValid(mrName)
            ? await admin_1.default.find({ _id: mrName, position: "MedicalRep(MR)" })
            : await admin_1.default.find({ name: mrName, position: "MedicalRep(MR)" });
        if (!mrs.length)
            return res.status(404).json({ success: false, message: "MR not found" });
        const mr = mrs[0];
        // Validate doctors
        const validDoctorIds = doctorList.filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
        if (!validDoctorIds.length)
            return res
                .status(400)
                .json({ success: false, message: "Invalid doctor IDs" });
        const doctors = await doctorModel_1.default.find({ _id: { $in: validDoctorIds } });
        if (!doctors.length)
            return res
                .status(404)
                .json({ success: false, message: "No doctors found" });
        // Map doctorList (callId auto-generated in schema)
        const formattedDoctorList = doctors.map((doc) => ({
            doctor: doc._id,
            status: "pending", // optional
        }));
        const report = new brickModel_1.default({
            mrName: mr._id,
            doctorList: formattedDoctorList,
            ...rest,
        });
        await report.save();
        return res.status(201).json({ success: true, data: report });
    }
    catch (error) {
        console.error("AddCallReport Error:", error);
        return res
            .status(500)
            .json({ success: false, message: error.message || "Server Error" });
    }
};
exports.addBrick = addBrick;
// 🟢 Get all call reports with pagination
const getAllBricks = async (req, res) => {
    try {
        const { mrName, area, date, startDate, endDate, page = "1", limit = "10", doctorPage = "1", doctorLimit = "10", } = req.query;
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;
        const docPageNumber = parseInt(doctorPage, 10) || 1;
        const docPageSize = parseInt(doctorLimit, 10) || 10;
        const skip = (pageNumber - 1) * pageSize;
        let filter = {};
        if (mrName && mrName !== "All") {
            if (mongoose_1.default.Types.ObjectId.isValid(mrName)) {
                filter.mrName = mrName;
            }
            else {
                const mr = await admin_1.default.findOne({
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
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            filter.createdAt = { $gte: dayStart, $lte: dayEnd };
        }
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filter.createdAt = { $gte: start, $lte: end };
        }
        const totalReports = await brickModel_1.default.countDocuments(filter);
        const reports = await brickModel_1.default.find(filter)
            .populate("doctorList.doctor")
            .populate("mrName")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);
        const reportsWithPaginatedDoctors = reports.map((report) => {
            const totalCalls = report.doctorList.length;
            const completedCalls = report.doctorList.filter((doc) => doc.status === "close").length;
            const doctorSkip = (docPageNumber - 1) * docPageSize;
            const paginatedDoctors = report.doctorList.slice(doctorSkip, doctorSkip + docPageSize);
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
    }
    catch (error) {
        console.error("GetAllCallReports Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server Error",
        });
    }
};
exports.getAllBricks = getAllBricks;
// ✅ Delete call report by ID
const deleteBrick = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedReport = await brickModel_1.default.findByIdAndDelete(id);
        if (!deletedReport)
            return res
                .status(404)
                .json({ success: false, message: "Brick not found" });
        res
            .status(200)
            .json({ success: true, message: "Brick deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting call report:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteBrick = deleteBrick;
// ✅ Update call report by ID
const updateBrick = async (req, res) => {
    try {
        const { id } = req.params;
        const { doctorList: incomingDoctors } = req.body;
        if (!incomingDoctors ||
            !Array.isArray(incomingDoctors) ||
            incomingDoctors.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "No doctor data provided." });
        }
        const callReport = await brickModel_1.default.findById(id);
        if (!callReport) {
            return res
                .status(404)
                .json({ success: false, message: "Brick not found" });
        }
        const existingDoctorIds = callReport.doctorList.map((d) => d.doctor.toString());
        incomingDoctors.forEach((doc) => {
            const doctorId = doc.doctor;
            const index = existingDoctorIds.indexOf(doctorId);
            if (index > -1) {
                Object.assign(callReport.doctorList[index], doc);
            }
            else {
                callReport.doctorList.push(brickModel_1.default.prepareDoctorList([doctorId])[0]);
            }
        });
        await callReport.save();
        await callReport.populate("doctorList.doctor");
        res.status(200).json({ success: true, data: callReport });
    }
    catch (error) {
        console.error("Error updating Brick doctors:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateBrick = updateBrick;
// ✅ Update the order of doctors in a call report
const reorderDoctorList = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderedDoctorIds } = req.body;
        if (!orderedDoctorIds ||
            !Array.isArray(orderedDoctorIds) ||
            orderedDoctorIds.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "No doctor IDs provided." });
        }
        const callReport = await brickModel_1.default.findById(id);
        if (!callReport) {
            return res
                .status(404)
                .json({ success: false, message: "Brick not found." });
        }
        const doctorMap = new Map(callReport.doctorList.map((d) => [d.doctor.toString(), d]));
        const reorderedList = orderedDoctorIds
            .map((docId) => doctorMap.get(docId))
            .filter(Boolean);
        if (reorderedList.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor IDs. No reorder performed.",
            });
        }
        callReport.doctorList.splice(0, callReport.doctorList.length, ...reorderedList);
        await callReport.save();
        await callReport.populate("doctorList.doctor");
        res.status(200).json({ success: true, data: callReport });
    }
    catch (error) {
        console.error("Error reordering doctor list:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.reorderDoctorList = reorderDoctorList;
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
const checkDoctorLocation = async (req, res) => {
    try {
        const { callReportId, doctorId, lat, lng } = req.body;
        if (!callReportId || !doctorId || lat === undefined || lng === undefined) {
            return res
                .status(400)
                .json({ success: false, message: "Missing fields" });
        }
        const callReport = await brickModel_1.default.findById(callReportId).populate("doctorList.doctor");
        if (!callReport) {
            return res
                .status(404)
                .json({ success: false, message: "Brick not found" });
        }
        const doctorEntry = callReport.doctorList.find((d) => d.doctor._id.toString() === doctorId);
        if (!doctorEntry) {
            return res
                .status(404)
                .json({ success: false, message: "Doctor not found in Brick" });
        }
        const doctorLat = doctorEntry.doctor.location.lat;
        const doctorLng = doctorEntry.doctor.location.lng;
        const distance = getDistanceFromLatLonInMeters(lat, lng, doctorLat, doctorLng);
        if (distance <= 500) {
            // Update doctor status in the callReport
            doctorEntry.status = "check In"; // ✅ Correct string
            await callReport.save();
            return res.status(200).json({
                success: true,
                message: "Location is match",
                distance,
            });
        }
        else {
            return res.status(200).json({
                success: false,
                message: "Location is not match",
                distance,
            });
        }
    }
    catch (error) {
        console.error("Error checking location:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.checkDoctorLocation = checkDoctorLocation;
