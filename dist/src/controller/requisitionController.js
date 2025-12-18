"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatus = exports.deleteRequisition = exports.updateRequisition = exports.getSingleRequisition = exports.getAllRequisitions = exports.addRequisition = void 0;
const requisitionModel_1 = __importDefault(require("../models/requisitionModel"));
const admin_1 = __importDefault(require("../models/admin"));
const requistionsValidation_1 = require("../validations/requistionsValidation");
// Generate unique reqId
const generateReqId = async () => {
    let unique = false;
    let reqId = "";
    while (!unique) {
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        reqId = `REQ-${randomDigits}`;
        const existing = await requisitionModel_1.default.findOne({ reqId });
        if (!existing)
            unique = true;
    }
    return reqId;
};
// Helper: calculate totals
const calculateTotals = (products = []) => {
    const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    return { totalQuantity };
};
// 🟢 Add a new requisition
const addRequisition = async (req, res) => {
    const { error } = (0, requistionsValidation_1.validateRequisitionData)(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details.map((d) => d.message).join(", "),
        });
    }
    try {
        const reqId = await generateReqId();
        if (req.body.requisitionType === "Cash" && !req.body.amount) {
            return res
                .status(400)
                .json({ error: "Amount is required for Cash type" });
        }
        const { totalQuantity } = calculateTotals(req.body.product);
        const newReq = new requisitionModel_1.default({
            ...req.body,
            reqId,
            totalQuantity,
        });
        const savedReq = await newReq.save();
        await savedReq.populate("doctor", "name image specialty");
        res.status(201).json({
            success: true,
            message: "Requisition added successfully",
            requisition: savedReq,
        });
    }
    catch (err) {
        console.error("Add Requisition Error:", err);
        res.status(500).json({ error: err.message });
    }
};
exports.addRequisition = addRequisition;
const getAllRequisitions = async (req, res) => {
    try {
        const { mrName, date, startDate, endDate, page = "1", limit = "10", } = req.query;
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;
        const skip = (pageNumber - 1) * pageSize;
        let filter = {};
        if (mrName && mrName !== "All") {
            filter.$or = [
                { mrName: mrName },
                {
                    mrName: {
                        $in: (await admin_1.default.find({ name: { $regex: mrName, $options: "i" } })).map((m) => m._id),
                    },
                },
            ];
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
        const total = await requisitionModel_1.default.countDocuments(filter);
        const requisitions = await requisitionModel_1.default.find(filter)
            .populate("doctor", "name image specialty")
            .populate("mrName", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);
        res.status(200).json({
            success: true,
            page: pageNumber,
            totalPages: Math.ceil(total / pageSize),
            totalItems: total,
            requisitions,
        });
    }
    catch (err) {
        console.error("Get All Requisitions Error:", err);
        res.status(500).json({ error: err.message });
    }
};
exports.getAllRequisitions = getAllRequisitions;
const getSingleRequisition = async (req, res) => {
    try {
        const requisition = await requisitionModel_1.default.findById(req.params.id).populate("doctor", "name image specialty");
        if (!requisition)
            return res.status(404).json({ error: "Requisition not found" });
        res.status(200).json({ success: true, requisition });
    }
    catch (err) {
        console.error("Get Single Requisition Error:", err);
        res.status(500).json({ error: err.message });
    }
};
exports.getSingleRequisition = getSingleRequisition;
// 🟢 Update requisition
const updateRequisition = async (req, res) => {
    try {
        const allowedFields = [
            "status",
            "paymentType",
            "remarks",
            "product",
            "amount",
            "requisitionType",
        ];
        const updates = {};
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });
        if (updates.requisitionType === "Cash" && !updates.amount) {
            return res
                .status(400)
                .json({ error: "Amount is required for Cash type" });
        }
        if (updates.product && Array.isArray(updates.product)) {
            const { totalQuantity } = calculateTotals(updates.product);
            updates.totalQuantity = totalQuantity;
        }
        const updatedReq = await requisitionModel_1.default.findByIdAndUpdate(req.params.id, updates, { new: true }).populate("doctor", "name image specialty");
        if (!updatedReq)
            return res.status(404).json({ error: "Requisition not found" });
        res.status(200).json({
            success: true,
            message: "Requisition updated successfully",
            requisition: updatedReq,
        });
    }
    catch (err) {
        console.error("Update Requisition Error:", err);
        res.status(500).json({ error: err.message });
    }
};
exports.updateRequisition = updateRequisition;
// 🟢 Delete requisition
const deleteRequisition = async (req, res) => {
    try {
        const deletedReq = await requisitionModel_1.default.findByIdAndDelete(req.params.id);
        if (!deletedReq)
            return res.status(404).json({ error: "Requisition not found" });
        res
            .status(200)
            .json({ success: true, message: "Requisition deleted successfully" });
    }
    catch (err) {
        console.error("Delete Requisition Error:", err);
        res.status(500).json({ error: err.message });
    }
};
exports.deleteRequisition = deleteRequisition;
// 🟢 Update updateStatus status
const updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // "accepted" or "rejected"
    // Validate status
    if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid status value",
        });
    }
    try {
        const updated = await requisitionModel_1.default.findByIdAndUpdate(id, {
            status, // status update
            accepted: status === "accepted", // boolean field update
        }, { new: true }).populate("doctor", "name image specialty");
        if (!updated) {
            return res
                .status(404)
                .json({ success: false, message: "Requisition not found" });
        }
        res.status(200).json({
            success: true,
            message: `Requisition ${status}`,
            data: updated,
        });
    }
    catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.updateStatus = updateStatus;
