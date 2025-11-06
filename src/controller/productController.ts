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
// Get all products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { sku, productName } = req.query;
    const filter: any = {};

    if (sku) {
      filter.sku = { $regex: new RegExp(sku as string, "i") };
    }

    if (productName) {
      filter.productName = { $regex: new RegExp(productName as string, "i") };
    }

    // ✅ Fetch products based on filters
    const products = await Product.find(filter).sort({ createdAt: -1 });

    // ✅ Get unique category list (no repeats)
    const categoryList = await Product.distinct("category");

    res.status(200).json({
      success: true,
      data: products,
      categoryList,
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
