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
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "CSV file is required" });
    }

    const results: any[] = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        // Parse product data if stored as JSON string in CSV
        if (row.products) {
          try {
            row.products = JSON.parse(row.products);
          } catch (err) {
            row.products = [];
          }
        }
        results.push(row);
      })
      .on("end", async () => {
        const validData: any[] = [];
        const errors: string[] = [];

        for (let i = 0; i < results.length; i++) {
          const { error, value } = distributorValidationSchema.validate(
            results[i],
            { abortEarly: false }
          );
          if (error) {
            errors.push(
              `Row ${i + 1}: ${error.details.map((e) => e.message).join(", ")}`
            );
          } else {
            validData.push(value);
          }
        }

        if (validData.length > 0) {
          await Distributor.insertMany(validData);
        }

        // Delete the uploaded CSV file
        fs.unlinkSync(req.file.path);

        return res.status(200).json({
          success: true,
          message: `${validData.length} records inserted successfully`,
          errors: errors,
        });
      });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server Error" });
  }
};
