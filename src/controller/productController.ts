import Product from "../models/productModel";
import { Request, Response } from "express";
import csv from "csv-parser";
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
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: products });
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

// Delete product
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
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const results: any[] = [];

    const stream = req.file.buffer;
    const readable = require("stream").Readable.from(stream.toString());
    readable
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        // Loop through CSV and update targets
        for (const row of results) {
          const { SKU, Target } = row;
          await Product.updateOne(
            { sku: SKU }, // match by SKU
            { $set: { target: Number(Target) } } // update target
          );
        }

        res
          .status(200)
          .json({ success: true, message: "Targets updated successfully" });
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "CSV update failed" });
  }
};
