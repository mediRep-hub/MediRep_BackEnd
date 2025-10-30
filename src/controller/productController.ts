import Product from "../models/productModel";
import { Request, Response } from "express";

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
