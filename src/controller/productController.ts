import Product from "../models/productModel";
import { Request, Response } from "express";
import csv from "csv-parser";
import { Order } from "../models/orderModel";
// Add new product
export const addProduct = async (req: Request, res: Response) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all products
// Get all products with pagination
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { sku, productName, page = "1", limit = "10" } = req.query;

    const filter: any = {};
    if (sku) {
      filter.sku = { $regex: new RegExp(sku as string, "i") };
    }
    if (productName) {
      filter.productName = { $regex: new RegExp(productName as string, "i") };
    }

    const pageNumber = parseInt(page as string, 10) || 1;
    const itemsPerPage = parseInt(limit as string, 10) || 10;

    // Total count for pagination
    const totalItems = await Product.countDocuments(filter);

    // Fetch paginated products
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * itemsPerPage)
      .limit(itemsPerPage);

    // Aggregate categories with count and total achievements/targets
    const categoryStats = await Product.aggregate([
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

    // Total across all products
    const totalStats = await Product.aggregate([
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedProduct)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const uploadCSVUpdateTarget = async (req: Request, res: Response) => {
  try {
    const results: any[] = req.body;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ message: "No data found in request" });
    }

    for (const row of results) {
      const { SKU, target } = row;
      await Product.updateOne(
        { sku: SKU },
        { $set: { target: Number(target) } }
      );
    }

    res
      .status(200)
      .json({ success: true, message: "Targets updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "CSV update failed" });
  }
};

export const getMonthlyAchievement = async (req: Request, res: Response) => {
  try {
    // Fetch orders and products
    const orders = await Order.find({}).lean();
    const products = await Product.find({}).lean();

    const productTargetMap: Record<string, number> = {};
    products.forEach((p) => {
      productTargetMap[p.productName] = p.target;
    });

    // Accumulate achievement and target per month
    const monthlyData: Record<
      string,
      { totalAchievement: number; totalTarget: number }
    > = {};

    orders.forEach((order) => {
      const month = order.orderDate.toISOString().slice(0, 7); // "YYYY-MM"
      order.medicines.forEach((med) => {
        const target = productTargetMap[med.name] || 0;
        if (!monthlyData[month]) {
          monthlyData[month] = { totalAchievement: 0, totalTarget: 0 };
        }
        monthlyData[month].totalAchievement += med.quantity;
        monthlyData[month].totalTarget += target;
      });
    });

    // Convert to sorted array
    const months = Object.keys(monthlyData).sort();
    const result: any[] = [];

    let prevPercentage = 0;
    months.forEach((month) => {
      const { totalAchievement, totalTarget } = monthlyData[month];
      const percentage =
        totalTarget === 0 ? 0 : (totalAchievement / totalTarget) * 100;

      const change =
        prevPercentage === 0
          ? 0
          : ((percentage - prevPercentage) / prevPercentage) * 100; // month-over-month % change

      result.push({
        month,
        totalAchievement,
        totalTarget,
        percentage: +percentage.toFixed(4),
        change: +change.toFixed(2), // positive or negative
      });

      prevPercentage = percentage;
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
