import { Request, Response } from "express";
import { Distributor } from "../models/primarySales";
import { distributorValidationSchema } from "../validations/primarySalesValidation";
import csv from "csv-parser";
import fs from "fs";

// Create Primary Sale
export const createPrimarySale = async (req: Request, res: Response) => {
  try {
    const { error, value } = distributorValidationSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map((e) => e.message).join(", "),
      });
    }

    const primarySale = new Distributor(value);
    await primarySale.save();

    return res.status(201).json({
      success: true,
      message: "Primary Sale created successfully",
      data: primarySale,
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server Error" });
  }
};

// Get All Primary Sales
export const getAllPrimarySales = async (req: Request, res: Response) => {
  try {
    const primarySales = await Distributor.find();
    return res.status(200).json({ success: true, data: primarySales });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server Error" });
  }
};

// Update Primary Sale by ID
export const updatePrimarySale = async (req: Request, res: Response) => {
  try {
    const { error, value } = distributorValidationSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map((e) => e.message).join(", "),
      });
    }

    const updatedPrimarySale = await Distributor.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true }
    );
    if (!updatedPrimarySale)
      return res
        .status(404)
        .json({ success: false, message: "Primary Sale not found" });

    return res.status(200).json({
      success: true,
      message: "Primary Sale updated successfully",
      data: updatedPrimarySale,
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server Error" });
  }
};

// Delete Primary Sale by ID
export const deletePrimarySale = async (req: Request, res: Response) => {
  try {
    const deletedPrimarySale = await Distributor.findByIdAndDelete(
      req.params.id
    );
    if (!deletedPrimarySale)
      return res
        .status(404)
        .json({ success: false, message: "Primary Sale not found" });

    return res
      .status(200)
      .json({ success: true, message: "Primary Sale deleted successfully" });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server Error" });
  }
};

export const uploadBulkPrimarySales = async (req: Request, res: Response) => {
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

    const products: any[] = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        products.push({
          sku: row.sku,
          productName: row.productName,
          openBalance: Number(row.openBalance) || 0,
          purchaseQNT: Number(row.purchaseQNT) || 0,
          saleQty: Number(row.saleQty) || 0,
          purchaseReturn: Number(row.purchaseReturn) || 0,
          saleReturnQNT: Number(row.saleReturnQNT) || 0,
          netSale: Number(row.netSale) || 0,
          floorStockValue: Number(row.floorStockValue) || 0,
        });
      })
      .on("end", async () => {
        // Only ONE Primary Sale document per distributor
        const primarySaleData = {
          distributorName,
          area,
          primarySale: products.reduce((sum, p) => sum + p.saleQty, 0),
          totalSaleQNT: products.reduce((sum, p) => sum + p.netSale, 0),
          floorStockQNT: products.reduce((sum, p) => sum + p.openBalance, 0),
          floorStockValue: products.reduce(
            (sum, p) => sum + p.floorStockValue,
            0
          ),
          status: "active", // or get from dropdown/CSV if needed
          products, // all products in array
        };

        await Distributor.create(primarySaleData);
        fs.unlinkSync(req.file.path);

        return res.status(200).json({
          success: true,
          message: `Primary Sale created with ${products.length} products`,
        });
      });
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server Error" });
  }
};
