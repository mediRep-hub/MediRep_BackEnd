import { Request, Response } from "express";
import { Order } from "../models/orderModel";
import Admin from "../models/admin";
import Product from "../models/productModel";
import { validateOrderData } from "../validations/orderValidation";

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
    const { error } = validateOrderData(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const newOrderId = await generateOrderId();

    const { medicines, discount = 0, ...rest } = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ message: "Medicines are required" });
    }

    let calculatedSubtotal = 0;

    for (let medicine of medicines) {
      const { medicineId, quantity } = medicine;

      if (!medicineId || !quantity) {
        return res.status(400).json({
          message: "Each medicine must have a medicineId and quantity",
        });
      }

      const product = await Product.findById(medicineId);
      if (!product) {
        return res.status(400).json({
          message: `Medicine with ID ${medicineId} does not exist`,
        });
      }

      const priceAtOrder = product.amount;

      calculatedSubtotal += quantity * priceAtOrder;

      medicine.priceAtOrder = priceAtOrder;
    }

    let total = calculatedSubtotal - calculatedSubtotal * (discount / 100);

    const newOrder = new Order({
      ...rest,
      orderId: newOrderId,
      medicines,
      subtotal: calculatedSubtotal,
      total,
      discount,
    });

    await newOrder.save();

    const populatedOrder = await Order.findById(newOrder._id)
      .populate("medicines.medicineId") // Populate the medicineId with the full Product object
      .exec();

    res.status(201).json({
      message: "Order created successfully",
      data: populatedOrder,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: "Error creating order",
      error: error.message,
    });
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

    // Pagination setup
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
    // Date Filter (Exact Date)
    // -----------------------------
    if (date) {
      const dayStart = new Date(date as string);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date as string);
      dayEnd.setHours(23, 59, 59, 999);

      filter.createdAt = { $gte: dayStart, $lte: dayEnd };
    }

    // -----------------------------
    // Date Range Filter (Start Date - End Date)
    // -----------------------------
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      filter.createdAt = { $gte: start, $lte: end };
    }

    // -----------------------------
    // Total Count of Filtered Orders
    // -----------------------------
    const totalItems = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / pageSize);

    // -----------------------------
    // Fetch Orders with Pagination and Population
    // -----------------------------
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .skip(skip) // Skip the previous pages based on pagination
      .limit(pageSize) // Limit the number of orders per page
      .populate("medicines.medicineId") // Populate medicineId with full Product data
      .populate("mrName", "name") // Populate the MR name
      .exec();

    // -----------------------------
    // Return the Response
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single order by ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    // Fetch the order by its ID and populate the medicine references
    const order = await Order.findById(req.params.id)
      .populate("medicines.medicineId") // Populate medicineId with full Product data
      .populate("mrName", "name") // Populate MR Name (assuming it's a reference to Admin)
      .exec();

    // Check if the order exists
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Return the populated order
    res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: order,
    });
  } catch (error: any) {
    console.error("Error fetching order by ID:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message,
    });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { medicines, ...rest } = req.body;

    const updatePayload: any = {
      ...rest,
    };

    // Only update medicines if provided
    if (medicines && Array.isArray(medicines)) {
      updatePayload.medicines = medicines;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Order updated successfully",
      data: updatedOrder,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error updating order",
      error: error.message,
    });
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
