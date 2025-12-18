"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBulkPrimarySales = exports.deletePrimarySale = exports.updatePrimarySale = exports.getAllPrimarySales = exports.createPrimarySale = void 0;
const primarySales_1 = require("../models/primarySales");
const primarySalesValidation_1 = require("../validations/primarySalesValidation");
const Papa = require("papaparse");
// Create Primary Sale
const createPrimarySale = async (req, res) => {
    try {
        const { error, value } = primarySalesValidation_1.distributorValidationSchema.validate(req.body, {
            abortEarly: false,
        });
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details.map((e) => e.message).join(", "),
            });
        }
        const primarySale = new primarySales_1.Distributor(value);
        await primarySale.save();
        return res.status(201).json({
            success: true,
            message: "Primary Sale created successfully",
            data: primarySale,
        });
    }
    catch (err) {
        return res
            .status(500)
            .json({ success: false, message: err.message || "Server Error" });
    }
};
exports.createPrimarySale = createPrimarySale;
// Get All Primary Sales
const getAllPrimarySales = async (req, res) => {
    try {
        const primarySales = await primarySales_1.Distributor.find();
        return res.status(200).json({ success: true, data: primarySales });
    }
    catch (err) {
        return res
            .status(500)
            .json({ success: false, message: err.message || "Server Error" });
    }
};
exports.getAllPrimarySales = getAllPrimarySales;
// Update Primary Sale by ID
const updatePrimarySale = async (req, res) => {
    try {
        const { error, value } = primarySalesValidation_1.distributorValidationSchema.validate(req.body, {
            abortEarly: false,
        });
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details.map((e) => e.message).join(", "),
            });
        }
        const updatedPrimarySale = await primarySales_1.Distributor.findByIdAndUpdate(req.params.id, value, { new: true });
        if (!updatedPrimarySale)
            return res
                .status(404)
                .json({ success: false, message: "Primary Sale not found" });
        return res.status(200).json({
            success: true,
            message: "Primary Sale updated successfully",
            data: updatedPrimarySale,
        });
    }
    catch (err) {
        return res
            .status(500)
            .json({ success: false, message: err.message || "Server Error" });
    }
};
exports.updatePrimarySale = updatePrimarySale;
// Delete Primary Sale by ID
const deletePrimarySale = async (req, res) => {
    try {
        const deletedPrimarySale = await primarySales_1.Distributor.findByIdAndDelete(req.params.id);
        if (!deletedPrimarySale)
            return res
                .status(404)
                .json({ success: false, message: "Primary Sale not found" });
        return res
            .status(200)
            .json({ success: true, message: "Primary Sale deleted successfully" });
    }
    catch (err) {
        return res
            .status(500)
            .json({ success: false, message: err.message || "Server Error" });
    }
};
exports.deletePrimarySale = deletePrimarySale;
const uploadBulkPrimarySales = async (req, res) => {
    try {
        const distributorName = req.body.distributorName;
        const area = req.body.area || "Unknown";
        if (!req.file) {
            return res
                .status(400)
                .json({ success: false, message: "CSV file is required" });
        }
        if (!distributorName) {
            return res
                .status(400)
                .json({ success: false, message: "Distributor is required" });
        }
        // Parse CSV from memory
        const csvString = req.file.buffer.toString("utf-8");
        const parsed = Papa.parse(csvString, {
            header: true,
            skipEmptyLines: true,
        });
        const rows = parsed.data;
        if (!rows.length) {
            return res.status(400).json({ success: false, message: "CSV is empty" });
        }
        // Create products array
        const products = rows.map((row) => ({
            sku: row.sku,
            productName: row.productName,
            openBalance: Number(row.openBalance) || 0,
            purchaseQNT: Number(row.purchaseQNT) || 0,
            saleQty: Number(row.saleQty) || 0,
            purchaseReturn: Number(row.purchaseReturn) || 0,
            saleReturnQNT: Number(row.saleReturnQNT) || 0,
            netSale: Number(row.netSale) || 0,
            floorStockValue: Number(row.floorStockValue) || 0,
        }));
        // Aggregate sale values
        const primarySaleData = {
            distributorName,
            area,
            primarySale: products.reduce((sum, p) => sum + p.saleQty, 0),
            totalSaleQNT: products.reduce((sum, p) => sum + p.netSale, 0),
            floorStockQNT: products.reduce((sum, p) => sum + p.openBalance, 0),
            floorStockValue: products.reduce((sum, p) => sum + p.floorStockValue, 0),
            status: "active",
            products,
        };
        await primarySales_1.Distributor.create(primarySaleData);
        return res.status(200).json({
            success: true,
            message: `Primary Sale created with ${products.length} products`,
        });
    }
    catch (err) {
        console.error("Bulk Upload Error:", err);
        return res
            .status(500)
            .json({ success: false, message: err.message || "Server Error" });
    }
};
exports.uploadBulkPrimarySales = uploadBulkPrimarySales;
