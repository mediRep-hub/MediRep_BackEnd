import { Request, Response } from "express";
import { Order } from "../models/orderModel";

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
export const addOrder = async (req: Request, res: Response) => {
  try {
    const newOrderId = await generateOrderId();
    const { medicines, ...rest } = req.body;

    // Calculate subtotal
    const subtotal = medicines.reduce(
      (acc: number, med: any) => acc + med.amount,
      0
    );

    const tax = +(subtotal * 0.1).toFixed(2); // 10% tax
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

    res
      .status(201)
      .json({ message: "Order created successfully", data: newOrder });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
  }
};

// Get all orders
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    // Read query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Count total orders
    const totalItems = await Order.countDocuments();

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch orders with pagination and populate doctor
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("doctor", "name specialty email phone image docId");

    res.status(200).json({
      data: orders,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
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

// Update order
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
