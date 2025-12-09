import Product from "../models/productModel";
import { Request, Response } from "express";
import { Order } from "../models/orderModel";
import { validateProductData } from "../validations/validateProductData";

// -----------------------------------------
// Add Product
// -----------------------------------------
export const addProduct = async (req: Request, res: Response) => {
  const { error } = validateProductData(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    // 🔒 Ensure discount array always includes RT
    if (!req.body.discount) {
      req.body.discount = [
        { channel: "RT", percent: 0 },
        { channel: "Local Modern Trade", percent: 0 },
        { channel: "Wholesale", percent: 0 },
      ];
    } else {
      const hasRT = req.body.discount.some((d: any) => d.channel === "RT");
      if (!hasRT) req.body.discount.push({ channel: "RT", percent: 0 });
    }

    const product = new Product(req.body);
    await product.save();

    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------
// Get All Products (with Filters / Pagination)
// -----------------------------------------
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { sku, productName, page = "1", limit = "10" } = req.query;

    const filter: any = {};

    if (sku) filter.sku = { $regex: new RegExp(sku as string, "i") };
    if (productName)
      filter.productName = { $regex: new RegExp(productName as string, "i") };

    const pageNumber = parseInt(page as string, 10);
    const itemsPerPage = parseInt(limit as string, 10);

    const totalItems = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * itemsPerPage)
      .limit(itemsPerPage);

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

// -----------------------------------------
// Update Product (Ensuring RT stays constant)
// -----------------------------------------
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Ensure discount exists
    if (req.body.discount) {
      const hasRT = req.body.discount.some((d: any) => d.channel === "RT");
      if (!hasRT) {
        req.body.discount.push({ channel: "RT", percent: 0 });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------
// Delete Product
// -----------------------------------------
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------
// CSV Bulk Update Target
// -----------------------------------------
export const uploadCSVUpdateTarget = async (req: Request, res: Response) => {
  try {
    const results = req.body.data;

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

// -----------------------------------------
// Monthly Achievement
// -----------------------------------------
export const getMonthlyAchievement = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({}).lean();
    const products = await Product.find({}).lean();

    const productTargetMap: Record<string, number> = {};
    products.forEach((p) => {
      productTargetMap[p._id.toString()] = p.target;
    });

    const monthlyData: Record<
      string,
      { totalAchievement: number; totalTarget: number }
    > = {};

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
    const result: any[] = [];
    let prevPercentage = 0;

    months.forEach((month) => {
      const { totalAchievement, totalTarget } = monthlyData[month];
      const percentage =
        totalTarget === 0 ? 0 : (totalAchievement / totalTarget) * 100;
      const change =
        prevPercentage === 0
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
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadDiscountCSV = async (req: Request, res: Response) => {
  try {
    const results = req.body.data;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ message: "No data found in request" });
    }

    const updatedProducts: any[] = [];

    for (const row of results) {
      const { SKU, ...discountData } = row;
      if (!SKU) continue;

      // Fetch product
      const product = await Product.findOne({ sku: SKU });
      if (!product) continue;

      product.discount.forEach((d) => {
        if (discountData[d.channel] !== undefined) {
          d.percent = Number(discountData[d.channel]);
        }
      });

      await product.save();
      updatedProducts.push({ sku: SKU, updated: true });
    }

    res.status(200).json({
      success: true,
      message: "Discounts updated successfully",
      updatedCount: updatedProducts.length,
      data: updatedProducts,
    });
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Discount update failed", error });
  }
};
