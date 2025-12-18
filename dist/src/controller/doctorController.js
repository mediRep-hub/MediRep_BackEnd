"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCSVDoctor = exports.deleteDoctor = exports.updateDoctor = exports.getDoctorById = exports.getAllDoctors = exports.getAllDoctorslist = exports.addDoctor = void 0;
const doctorModel_1 = __importDefault(require("../models/doctorModel"));
const stream_1 = require("stream");
const csv_parser_1 = __importDefault(require("csv-parser"));
const axios_1 = __importDefault(require("axios"));
const doctorValidation_1 = require("../validations/doctorValidation");
const generateDocId = async () => {
    let unique = false;
    let docId = "";
    while (!unique) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        docId = `DOC${randomNum}`;
        const existing = await doctorModel_1.default.findOne({ docId });
        if (!existing)
            unique = true;
    }
    return docId;
};
const addDoctor = async (req, res) => {
    const { error } = (0, doctorValidation_1.validateDoctorData)(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details.map((d) => d.message).join(", "),
        });
    }
    try {
        const docId = await generateDocId();
        const { name, specialty, email, phone, startTime, endTime, region, area, affiliation, profileType, image, location, } = req.body;
        if (!location ||
            !location.address ||
            location.lat == null ||
            location.lng == null) {
            return res.status(400).json({
                success: false,
                message: "Location with address, lat, and lng is required",
            });
        }
        const existingDoctor = await doctorModel_1.default.findOne({
            $or: [{ name }, { email }, { phone }],
        });
        if (existingDoctor) {
            let conflictMsg = "";
            if (existingDoctor.name === name)
                conflictMsg = "Name already exists";
            else if (existingDoctor.email === email)
                conflictMsg = "Email already exists";
            else if (existingDoctor.phone === phone)
                conflictMsg = "Phone number already exists";
            return res.status(400).json({
                success: false,
                message: conflictMsg,
            });
        }
        const doctor = new doctorModel_1.default({
            docId,
            name,
            specialty,
            email,
            phone,
            startTime,
            endTime,
            region,
            area,
            affiliation,
            profileType,
            image,
            location,
        });
        await doctor.save();
        res.status(201).json({
            success: true,
            message: "Doctor added successfully",
            data: doctor,
        });
    }
    catch (error) {
        console.error("Add Doctor Error:", error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || "Failed to add doctor",
        });
    }
};
exports.addDoctor = addDoctor;
// ✅ Get all doctors
const getAllDoctorslist = async (req, res) => {
    try {
        const { area } = req.query; // get area from query params
        const filter = {};
        if (area && area !== "All") {
            filter.area = area; // filter by area if provided
        }
        const doctors = await doctorModel_1.default.find(filter).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: doctors.length,
            data: doctors,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch doctors",
        });
    }
};
exports.getAllDoctorslist = getAllDoctorslist;
const getAllDoctors = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;
        const totalDoctors = await doctorModel_1.default.countDocuments();
        const doctors = await doctorModel_1.default.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.status(200).json({
            success: true,
            total: totalDoctors,
            page,
            pages: Math.ceil(totalDoctors / limit),
            count: doctors.length,
            data: doctors,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch doctors",
        });
    }
};
exports.getAllDoctors = getAllDoctors;
const getDoctorById = async (req, res) => {
    try {
        const doctor = await doctorModel_1.default.findById(req.params.id);
        if (!doctor)
            return res
                .status(404)
                .json({ success: false, message: "Doctor not found" });
        res.status(200).json({ success: true, data: doctor });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch doctor",
        });
    }
};
exports.getDoctorById = getDoctorById;
// ✅ Update doctor
const updateDoctor = async (req, res) => {
    const { error } = (0, doctorValidation_1.validateDoctorData)(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details.map((d) => d.message).join(", "),
        });
    }
    try {
        const doctor = await doctorModel_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!doctor)
            return res
                .status(404)
                .json({ success: false, message: "Doctor not found" });
        res.status(200).json({
            success: true,
            message: "Doctor updated successfully",
            data: doctor,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update doctor",
        });
    }
};
exports.updateDoctor = updateDoctor;
// ✅ Delete doctor
const deleteDoctor = async (req, res) => {
    try {
        const doctor = await doctorModel_1.default.findByIdAndDelete(req.params.id);
        if (!doctor)
            return res
                .status(404)
                .json({ success: false, message: "Doctor not found" });
        res.status(200).json({
            success: true,
            message: "Doctor deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete doctor",
        });
    }
};
exports.deleteDoctor = deleteDoctor;
const uploadCSVDoctor = async (req, res) => {
    const { error } = (0, doctorValidation_1.validateDoctorData)(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details.map((d) => d.message).join(", "),
        });
    }
    try {
        if (!req.file) {
            return res
                .status(400)
                .json({ success: false, message: "No file uploaded." });
        }
        const rows = [];
        const stream = stream_1.Readable.from(req.file.buffer);
        await new Promise((resolve, reject) => {
            stream
                .pipe((0, csv_parser_1.default)())
                .on("data", (row) => rows.push(row))
                .on("end", resolve)
                .on("error", reject);
        });
        if (!rows.length) {
            return res.status(400).json({
                success: false,
                message: "CSV is empty",
            });
        }
        const apiKey = "AIzaSyBrNjsUsrJ0Mmjhe-WUKDKVaIsMkZ8iQ4A";
        const doctorsWithData = await Promise.all(rows.map(async (r) => {
            const fullAddress = r.address || r.Address || r.location_address || r.Location || "";
            let lat = Number(r.location_lat) || 0;
            let lng = Number(r.location_lng) || 0;
            if ((!lat || !lng) && fullAddress) {
                try {
                    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;
                    const response = await axios_1.default.get(url);
                    if (response.data.results?.length > 0) {
                        lat = response.data.results[0].geometry.location.lat;
                        lng = response.data.results[0].geometry.location.lng;
                    }
                }
                catch (err) {
                    console.log("❌ Geocoding Error:", err.message);
                }
            }
            return {
                docId: r.docId || `DOC${Math.floor(1000 + Math.random() * 9000)}`,
                name: r.name || r.Name || "",
                specialty: r.specialty || r.Specialty || "",
                email: r.email || r.Email || "",
                phone: r.phone || r.Phone || "",
                startTime: r.startTime || r.StartTime || "",
                endTime: r.endTime || r.EndTime || "",
                region: r.region || r.Region || "",
                area: r.area || r.Area || "",
                affiliation: r.affiliation || r.Affiliation || "",
                image: r.image || r.Image || "",
                location: {
                    address: fullAddress,
                    lat,
                    lng,
                },
            };
        }));
        const inserted = await doctorModel_1.default.insertMany(doctorsWithData, {
            ordered: false,
        });
        return res.status(201).json({
            success: true,
            message: `✅ ${inserted.length} records inserted successfully out of ${doctorsWithData.length}`,
        });
    }
    catch (err) {
        console.error("Upload CSV Error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Upload failed",
        });
    }
};
exports.uploadCSVDoctor = uploadCSVDoctor;
