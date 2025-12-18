"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyAchievement = exports.uploadCSVUpdateTarget = exports.deleteProduct = exports.updateProduct = exports.getAllProductsMR = exports.getAllProducts = exports.addProduct = void 0;
const productModel_1 = __importDefault(require("../models/productModel"));
const orderModel_1 = require("../models/orderModel");
const validateProductData_1 = require("../validations/validateProductData");
// Add new product
const addProduct = async (req, res) => {
    const { error } = (0, validateProductData_1.validateProductData)(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    try {
        const product = new productModel_1.default(req.body);
        await product.save();
        res.status(201).json({ success: true, data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.addProduct = addProduct;
// Get all products
// Get all products with pagination
const getAllProducts = async (req, res) => {
    try {
        const { sku, productName, page = "1", limit = "10" } = req.query;
        const filter = {};
        if (sku) {
            filter.sku = { $regex: new RegExp(sku, "i") };
        }
        if (productName) {
            filter.productName = { $regex: new RegExp(productName, "i") };
        }
        const pageNumber = parseInt(page, 10) || 1;
        const itemsPerPage = parseInt(limit, 10) || 10;
        const totalItems = await productModel_1.default.countDocuments(filter);
        const products = await productModel_1.default.find(filter)
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * itemsPerPage)
            .limit(itemsPerPage);
        const categoryStats = await productModel_1.default.aggregate([
            {
                $group: {
                    _id: "$category",
                    productCount: { $sum: 1 },
                    totalTarget: { $sum: "$target" },
                    totalAchievement: { $sum: "$achievement" },
                },
            },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    productCount: 1,
                    totalTarget: 1,
                    totalAchievement: 1,
                    percentage: {
                        $cond: [
                            { $eq: ["$totalTarget", 0] },
                            0,
                            {
                                $multiply: [
                                    { $divide: ["$totalAchievement", "$totalTarget"] },
                                    100,
                                ],
                            },
                        ],
                    },
                },
            },
            { $sort: { name: 1 } },
        ]);
        const totalStats = await productModel_1.default.aggregate([
            {
                $group: {
                    _id: null,
                    totalTarget: { $sum: "$target" },
                    totalAchievement: { $sum: "$achievement" },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalTarget: 1,
                    totalAchievement: 1,
                    percentage: {
                        $cond: [
                            { $eq: ["$totalTarget", 0] },
                            0,
                            {
                                $multiply: [
                                    { $divide: ["$totalAchievement", "$totalTarget"] },
                                    100,
                                ],
                            },
                        ],
                    },
                },
            },
        ]);
        res.status(200).json({
            success: true,
            data: products,
            categorySummary: categoryStats,
            totalSummary: totalStats[0] || {
                totalTarget: 0,
                totalAchievement: 0,
                percentage: 0,
            },
            pagination: {
                currentPage: pageNumber,
                itemsPerPage,
                totalItems,
                totalPages: Math.ceil(totalItems / itemsPerPage),
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllProducts = getAllProducts;
const getAllProductsMR = async (req, res) => {
    try {
        // Fetch all products excluding Discontinued
        const products = await productModel_1.default.find({
            isStatus: { $ne: "Discontinued" },
        }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: products,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllProductsMR = getAllProductsMR;
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedProduct = await productModel_1.default.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        if (!updatedProduct)
            return res
                .status(404)
                .json({ success: false, message: "Product not found" });
        res.status(200).json({ success: true, data: updatedProduct });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProduct = await productModel_1.default.findByIdAndDelete(id);
        if (!deletedProduct)
            return res
                .status(404)
                .json({ success: false, message: "Product not found" });
        res
            .status(200)
            .json({ success: true, message: "Product deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteProduct = deleteProduct;
const uploadCSVUpdateTarget = async (req, res) => {
    try {
        const results = req.body.data;
        if (!results || !Array.isArray(results) || results.length === 0) {
            return res.status(400).json({ message: "No data found in request" });
        }
        for (const row of results) {
            const { SKU, target } = row;
            await productModel_1.default.updateOne({ sku: SKU }, { $set: { target: Number(target) } });
        }
        res
            .status(200)
            .json({ success: true, message: "Targets updated successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "CSV update failed" });
    }
};
exports.uploadCSVUpdateTarget = uploadCSVUpdateTarget;
const getMonthlyAchievement = async (req, res) => {
    try {
        const orders = await orderModel_1.Order.find({}).lean();
        const products = await productModel_1.default.find({}).lean();
        const productTargetMap = {};
        products.forEach((p) => {
            productTargetMap[p._id.toString()] = p.target;
        });
        const monthlyData = {};
        orders.forEach((order) => {
            const month = new Date(order.createdAt).toISOString().slice(0, 7);
            order.medicines.forEach((med) => {
                const productId = med.medicineId?.toString() || "";
                const target = productTargetMap[productId] || 0;
                if (!monthlyData[month]) {
                    monthlyData[month] = { totalAchievement: 0, totalTarget: 0 };
                }
                monthlyData[month].totalAchievement += Number(med.quantity);
                monthlyData[month].totalTarget += target;
            });
        });
        const allMonths = [
            "2025-01",
            "2025-02",
            "2025-03",
            "2025-04",
            "2025-05",
            "2025-06",
            "2025-07",
            "2025-08",
            "2025-09",
            "2025-10",
            "2025-11",
            "2025-12",
        ];
        allMonths.forEach((m) => {
            if (!monthlyData[m]) {
                monthlyData[m] = { totalAchievement: 0, totalTarget: 0 };
            }
        });
        const months = Object.keys(monthlyData).sort();
        const result = [];
        let prevPercentage = 0;
        months.forEach((month) => {
            const { totalAchievement, totalTarget } = monthlyData[month];
            const percentage = totalTarget === 0 ? 0 : (totalAchievement / totalTarget) * 100;
            const change = prevPercentage === 0
                ? 0
                : ((percentage - prevPercentage) / prevPercentage) * 100;
            result.push({
                month,
                totalAchievement,
                totalTarget,
                percentage: +percentage.toFixed(4),
                change: +change.toFixed(2),
            });
            prevPercentage = percentage;
        });
        return res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMonthlyAchievement = getMonthlyAchievement;
