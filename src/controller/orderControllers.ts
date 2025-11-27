import { Request, Response } from "express";
import { Order } from "../models/orderModel";
import Admin from "../models/admin";
import Product from "../models/productModel";

// Generate auto-incremented Order ID
const generateOrderId = async (): Promise<string> => {
  const lastOrder = await Order.findOne().sort({ createdAt: -1 });
  let newIdNumber = 1;

  if (lastOrder && lastOrder.orderId) {
    const lastIdNumber = parseInt(lastOrder.orderId.split("-")[1]);
    if (!isNaN(lastIdNumber)) newIdNumber = lastIdNumber + 1;
  }

  return `ORD-${newIdNumber.toString().padStart(4, "0")}`;
};

// Add new order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const newOrderId = await generateOrderId();
    const { medicines, ...rest } = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ message: "Medicines are required" });
    }

    const subtotal = medicines.reduce(
      (acc: number, med: any) => acc + med.amount,
      0
    );
    const tax = +(subtotal * 0.1).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);

    const newOrder = new Order({
      ...rest,
      orderId: newOrderId,
      medicines,
      subtotal,
      tax,
      total,
    });
    await newOrder.save();
    for (const med of medicines) {
      const { name, quantity } = med;

      await Product.updateOne(
        { productName: name },
        { $inc: { achievement: quantity } }
      );
    }

    res.status(201).json({
      message: "Order created successfully",
      data: newOrder,
    });
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
  }
};

// Get all orders
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      mrName,
      date,
      startDate,
      endDate,
    } = req.query;

    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    let filter: any = {};

    // -----------------------------
    // MR Name Filter
    // -----------------------------
    if (mrName && mrName !== "All") {
      filter.$or = [
        { mrName: mrName },
        {
          mrName: {
            $in: (
              await Admin.find({ name: { $regex: mrName, $options: "i" } })
            ).map((m) => m._id),
          },
        },
      ];
    }

    // -----------------------------
    // Date Filter
    // -----------------------------
    if (date) {
      const dayStart = new Date(date as string);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date as string);
      dayEnd.setHours(23, 59, 59, 999);

      filter.createdAt = { $gte: dayStart, $lte: dayEnd };
    }

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      filter.createdAt = { $gte: start, $lte: end };
    }

    // -----------------------------
    // Total count
    // -----------------------------
    const totalItems = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / pageSize);

    // -----------------------------
    // Fetch orders with pagination
    // -----------------------------
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("doctor", "name specialty email phone image docId")
      .populate("mrName", "name");

    // -----------------------------
    // Response
    // -----------------------------
    res.status(200).json({
      success: true,
      page: pageNumber,
      totalPages,
      totalItems,
      data: orders,
    });
  } catch (error: any) {
    console.error("GetAllOrders Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single order by ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json(order);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching order", error: error.message });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { medicines, ...rest } = req.body;

    let subtotal, tax, total;

    if (medicines) {
      subtotal = medicines.reduce(
        (acc: number, med: any) => acc + med.amount,
        0
      );
      tax = +(subtotal * 0.1).toFixed(2);
      total = +(subtotal + tax).toFixed(2);
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { ...rest, ...(medicines && { medicines, subtotal, tax, total }) },
      { new: true }
    );

    if (!updatedOrder)
      return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Order updated", data: updatedOrder });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error updating order", error: error.message });
  }
};

// Delete order
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder)
      return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error deleting order", error: error.message });
  }
};
