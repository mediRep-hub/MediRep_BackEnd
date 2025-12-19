"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSalesGroup = exports.updateSalesGroup = exports.getSalesGroupById = exports.getAllSalesGroups = exports.createSalesGroup = void 0;
const brickGroup_1 = __importDefault(require("../models/brickGroup"));
const brickGroupvalidation_1 = require("../validations/brickGroupvalidation");
// Create new Sales Group
const createSalesGroup = async (req, res) => {
    try {
        const { error } = brickGroupvalidation_1.SalesGroupValidation.validate(req.body);
        if (error)
            return res
                .status(400)
                .json({ success: false, message: error.details[0].message });
        const newGroup = new brickGroup_1.default(req.body);
        await newGroup.save();
        res.status(201).json({ success: true, data: newGroup });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.createSalesGroup = createSalesGroup;
// Get all Sales Groups
const getAllSalesGroups = async (req, res) => {
    try {
        const groups = await brickGroup_1.default.find();
        res.status(200).json({ success: true, data: groups });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getAllSalesGroups = getAllSalesGroups;
// Get single Sales Group by ID
const getSalesGroupById = async (req, res) => {
    try {
        const group = await brickGroup_1.default.findById(req.params.id);
        if (!group)
            return res
                .status(404)
                .json({ success: false, message: "Group not found" });
        res.status(200).json({ success: true, data: group });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getSalesGroupById = getSalesGroupById;
// Update Sales Group
const updateSalesGroup = async (req, res) => {
    try {
        const { error } = brickGroupvalidation_1.SalesGroupValidation.validate(req.body);
        if (error)
            return res
                .status(400)
                .json({ success: false, message: error.details[0].message });
        const updatedGroup = await brickGroup_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedGroup)
            return res
                .status(404)
                .json({ success: false, message: "Group not found" });
        res.status(200).json({ success: true, data: updatedGroup });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateSalesGroup = updateSalesGroup;
// Delete Sales Group
const deleteSalesGroup = async (req, res) => {
    try {
        const deletedGroup = await brickGroup_1.default.findByIdAndDelete(req.params.id);
        if (!deletedGroup)
            return res
                .status(404)
                .json({ success: false, message: "Group not found" });
        res.status(200).json({ success: true, message: "Deleted successfully" });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.deleteSalesGroup = deleteSalesGroup;
