"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCSVPharmacy = exports.deletePharmacy = exports.updatePharmacy = exports.getPharmacyById = exports.getAllPharmacies = exports.getAllPharmaciesList = exports.addPharmacy = void 0;
const phramacyModel_1 = __importDefault(require("../models/phramacyModel"));
const stream_1 = require("stream");
const csv_parser_1 = __importDefault(require("csv-parser"));
const axios_1 = __importDefault(require("axios"));
const pharmacyValidation_1 = require("../validations/pharmacyValidation");
const generatePharmacyId = async () => {
    let unique = false;
    let pharmacyId = "";
    while (!unique) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        pharmacyId = `PHA${randomNum}`;
        const existing = await phramacyModel_1.default.findOne({ pharmacyId });
        if (!existing)
            unique = true;
    }
    return pharmacyId;
};
const addPharmacy = async (req, res) => {
    const { error } = (0, pharmacyValidation_1.validatePharmacyData)(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details.map((d) => d.message).join(", "),
        });
    }
    try {
        const pharmacyId = await generatePharmacyId();
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
        const pharmacy = new phramacyModel_1.default({
            pharmacyId,
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
        await pharmacy.save();
        res.status(201).json({
            success: true,
            message: "Pharmacy added successfully",
            data: pharmacy,
        });
    }
    catch (error) {
        console.error("Add Pharmacy Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to add pharmacy",
        });
    }
};
exports.addPharmacy = addPharmacy;
// ✅ Get all pharmacies
const getAllPharmaciesList = async (req, res) => {
    try {
        const pharmacies = await phramacyModel_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: pharmacies.length,
            data: pharmacies,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch pharmacies",
        });
    }
};
exports.getAllPharmaciesList = getAllPharmaciesList;
// ✅ Get all pharmacies with pagination
const getAllPharmacies = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;
        const totalPharmacies = await phramacyModel_1.default.countDocuments();
        const pharmacies = await phramacyModel_1.default.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.status(200).json({
            success: true,
            total: totalPharmacies,
            page,
            pages: Math.ceil(totalPharmacies / limit),
            count: pharmacies.length,
            data: pharmacies,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch pharmacies",
        });
    }
};
exports.getAllPharmacies = getAllPharmacies;
// ✅ Get single pharmacy by ID
const getPharmacyById = async (req, res) => {
    try {
        const pharmacy = await phramacyModel_1.default.findById(req.params.id);
        if (!pharmacy)
            return res
                .status(404)
                .json({ success: false, message: "Pharmacy not found" });
        res.status(200).json({ success: true, data: pharmacy });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch pharmacy",
        });
    }
};
exports.getPharmacyById = getPharmacyById;
// ✅ Update pharmacy
const updatePharmacy = async (req, res) => {
    const { error } = (0, pharmacyValidation_1.validatePharmacyData)(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details.map((d) => d.message).join(", "),
        });
    }
    try {
        const pharmacy = await phramacyModel_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!pharmacy)
            return res
                .status(404)
                .json({ success: false, message: "Pharmacy not found" });
        res.status(200).json({
            success: true,
            message: "Pharmacy updated successfully",
            data: pharmacy,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update pharmacy",
        });
    }
};
exports.updatePharmacy = updatePharmacy;
// ✅ Delete pharmacy
const deletePharmacy = async (req, res) => {
    try {
        const pharmacy = await phramacyModel_1.default.findByIdAndDelete(req.params.id);
        if (!pharmacy)
            return res
                .status(404)
                .json({ success: false, message: "Pharmacy not found" });
        res.status(200).json({
            success: true,
            message: "Pharmacy deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete pharmacy",
        });
    }
};
exports.deletePharmacy = deletePharmacy;
// ✅ Upload CSV for pharmacies
const uploadCSVPharmacy = async (req, res) => {
    const { error } = (0, pharmacyValidation_1.validatePharmacyData)(req.body);
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
        const pharmaciesWithData = await Promise.all(rows.map(async (r) => {
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
                pharmacyId: r.pharmacyId || `PHA${Math.floor(1000 + Math.random() * 9000)}`,
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
        const inserted = await phramacyModel_1.default.insertMany(pharmaciesWithData, {
            ordered: false,
        });
        return res.status(201).json({
            success: true,
            message: `✅ ${inserted.length} records inserted successfully out of ${pharmaciesWithData.length}`,
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
exports.uploadCSVPharmacy = uploadCSVPharmacy;
