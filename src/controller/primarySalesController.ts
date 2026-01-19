import { Request, Response } from "express";
import { primarySaleValidation } from "../validations/primarySalesValidation";
import { PrimarySale } from "../models/primarySales";
import { Order } from "../models/orderModel";

const Papa = require("papaparse");
export const createPrimarySale = async (req: Request, res: Response) => {
  try {
    const { error, value } = primarySaleValidation.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map((e) => e.message).join(", "),
      });
    }

    const sale = await PrimarySale.create(value);

    return res.status(201).json({
      success: true,
      message: "Primary Sale created successfully",
      data: sale,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getAllPrimarySales = async (_req: Request, res: Response) => {
  try {
    // Get PrimarySale documents where IStatus is true
    const primarySales = await PrimarySale.find({ IStatus: true })
      .populate("pharmacyId", "name location area discount")
      .populate(
        "medicines.medicineId",
        "productName category amount productImage isStatus sku"
      );

    // Get Order documents where IStatus is true
    const activeOrders = await Order.find({ IStatus: true })
      .populate("pharmacyId", "name location area discount")
      .populate(
        "medicines.medicineId",
        "productName category amount productImage isStatus sku"
      );

    // Combine both arrays
    const allSales = [...primarySales, ...activeOrders];

    res.status(200).json({
      success: true,
      data: allSales,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

// GET BY ID
export const getPrimarySaleById = async (req: Request, res: Response) => {
  try {
    const sale = await PrimarySale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Primary Sale not found",
      });
    }

    res.status(200).json({ success: true, data: sale });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE
export const updatePrimarySale = async (req: Request, res: Response) => {
  try {
    const { error, value } = primarySaleValidation.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map((e) => e.message).join(", "),
      });
    }

    const sale = await PrimarySale.findByIdAndUpdate(req.params.id, value, {
      new: true,
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Primary Sale not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Primary Sale updated successfully",
      data: sale,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE
export const deletePrimarySale = async (req: Request, res: Response) => {
  try {
    const sale = await PrimarySale.findByIdAndDelete(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Primary Sale not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Primary Sale deleted successfully",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const uploadBulkPrimarySales = async (req: Request, res: Response) => {
  try {
    // 1️⃣ Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CSV file is required",
      });
    }

    // 2️⃣ Check if distributorName exists in form data
    const distributorName = req.body.distributorName;
    if (!distributorName) {
      return res.status(400).json({
        success: false,
        message: "Distributor name is required",
      });
    }

    // 3️⃣ Parse CSV file
    const csvString = req.file.buffer.toString("utf-8");
    const parsed = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data as any[];

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "CSV file is empty",
      });
    }

    // 4️⃣ Group rows by orderId
    const orderMap: Record<string, any> = {};

    for (const row of rows) {
      const orderId = row.orderId?.trim();

      if (!orderId) continue; // skip rows without orderId

      if (!orderMap[orderId]) {
        orderMap[orderId] = {
          orderId,
          mrName: row.mrName,
          distributorName, // from req.body
          pharmacyId: row.pharmacyId,
          address: row.address,
          medicines: [],
          subtotal: Number(row.subtotal) || 0,
          discount: Number(row.discount) || 0,
          total: Number(row.total) || 0,
          IStatus: true,
        };
      }

      orderMap[orderId].medicines.push({
        medicineId: row.medicineId,
        quantity: Number(row.quantity) || 1,
      });
    }

    const orders = Object.values(orderMap);

    if (!orders.length) {
      return res.status(400).json({
        success: false,
        message: "No valid orders found in CSV",
      });
    }

    // 5️⃣ Insert orders into MongoDB
    await PrimarySale.insertMany(orders);

    return res.status(201).json({
      success: true,
      message: `${orders.length} primary sales uploaded successfully`,
    });
  } catch (err: any) {
    console.error("Bulk Upload Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};
