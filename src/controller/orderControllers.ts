import { Request, Response } from "express";
import { Order } from "../models/orderModel";
import Admin from "../models/admin";
import Product from "../models/productModel";
import { validateOrderData } from "../validations/orderValidation";
import mongoose from "mongoose";
import Pharmacy from "../models/phramacyModel";
import dayjs from "dayjs";
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
    const {
      medicines,
      pharmacyId,
      discount: requestDiscount,
      ...rest
    } = req.body;

    // Validate pharmacyId
    if (!pharmacyId)
      return res.status(400).json({ message: "pharmacyId is required" });
    if (!mongoose.Types.ObjectId.isValid(pharmacyId))
      return res.status(400).json({ message: "Invalid pharmacyId" });

    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy)
      return res.status(400).json({ message: "Pharmacy not found" });

    // Validate medicines
    if (!Array.isArray(medicines) || medicines.length === 0)
      return res.status(400).json({ message: "Medicines are required" });

    let calculatedSubtotal = 0;
    for (let med of medicines) {
      const { medicineId, quantity } = med;
      if (!medicineId || !quantity)
        return res
          .status(400)
          .json({ message: "Each medicine must have medicineId & quantity" });
      if (!mongoose.Types.ObjectId.isValid(medicineId))
        return res
          .status(400)
          .json({ message: `Invalid medicineId: ${medicineId}` });

      const product = await Product.findById(medicineId);
      if (!product)
        return res
          .status(400)
          .json({ message: `Medicine not found for ID: ${medicineId}` });

      const qty = Number(quantity);
      if (isNaN(qty) || qty <= 0)
        return res
          .status(400)
          .json({ message: `Invalid quantity for medicineId: ${medicineId}` });

      med.priceAtOrder = product.amount;
      calculatedSubtotal += qty * product.amount;

      // Increase product achievement
      await Product.updateOne(
        { _id: medicineId },
        { $inc: { achievement: qty } }
      );
    }

    // Determine discount
    let discount = Number(requestDiscount ?? 0); // Use request discount first
    if (!discount && pharmacy.discount?.value) {
      const now = new Date();
      if (!pharmacy.discount.endDate || pharmacy.discount.endDate > now) {
        discount = pharmacy.discount.value;
        if (pharmacy.discount.duration && pharmacy.discount.duration > 0) {
          pharmacy.discount.duration -= 1;
          await pharmacy.save();
        }
      }
    }

    // Total calculation
    const total =
      discount > 0
        ? calculatedSubtotal - calculatedSubtotal * (discount / 100)
        : calculatedSubtotal;

    // IStatus logic: if discount is 0 → true, otherwise false
    const IStatus = discount === 0 ? true : false;
    const status = discount > 0 ? "Discount Applied" : "Normal";

    const newOrder = new Order({
      ...rest,
      orderId: newOrderId,
      medicines,
      subtotal: calculatedSubtotal,
      total,
      discount,
      pharmacyId,
      status,
      IStatus, // use the calculated IStatus here
    });

    await newOrder.save();

    const populatedOrder = await Order.findById(newOrder._id)
      .populate("medicines.medicineId")
      .populate("pharmacyId")
      .exec();

    return res
      .status(201)
      .json({ message: "Order created successfully", data: populatedOrder });
  } catch (error: any) {
    console.error("Create Order Error:", error);
    return res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      mrName,
      date,
      startDate,
      endDate,
      status, // optional query param: "pending" to get only pending orders
    } = req.query;

    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    let filter: any = {};

    // Filter by MR name
    if (mrName && mrName !== "All") {
      const mrDocs = await Admin.find({
        name: { $regex: mrName, $options: "i" },
        position: "MedicalRep(MR)",
      });

      const mrIds = mrDocs.map((m) => m._id);
      filter.mrName = { $in: mrIds };
    }

    // Filter by single date
    if (date) {
      const dayStart = new Date(date as string);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date as string);
      dayEnd.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: dayStart, $lte: dayEnd };
    }

    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    // Filter by status (pending only)
    if (status === "pending") filter.IStatus = false;
    else if (status === "approved") filter.IStatus = true;

    // Total count for pagination
    const totalItems = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / pageSize);

    // Fetch orders with pagination
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("medicines.medicineId")
      .populate("mrName", "name")
      .populate({
        path: "pharmacyId",
        select: "name location address lat lng discount area", // ✅ include discount from pharmacy
      })
      .exec();

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

export const acceptOrder = async (req: Request, res: Response) => {
  try {
    const { orderId, duration, discount } = req.body;

    // Validation
    if (!orderId)
      return res.status(400).json({ message: "orderId is required" });
    if (!duration)
      return res.status(400).json({ message: "duration is required" });
    if (!discount && discount !== 0)
      return res.status(400).json({ message: "discount is required" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Update order status → Accept
    order.IStatus = true;
    order.discount = Number(discount); // ✅ order.discount must be Number
    await order.save();

    const pharmacy = await Pharmacy.findById(order.pharmacyId);
    if (!pharmacy)
      return res.status(404).json({ message: "Pharmacy not found" });

    // Update pharmacy discount
    pharmacy.discount = {
      value: Number(discount),
      duration: Number(duration),
      endDate: dayjs().add(Number(duration), "month").toDate(),
    };

    await pharmacy.save();

    return res.status(200).json({
      message: "Order accepted & pharmacy discount updated",
      orderStatus: order.IStatus,
      discountApplied: pharmacy.discount,
    });
  } catch (error: any) {
    console.error("Accept Order Error:", error);
    return res.status(500).json({ message: "Error", error: error.message });
  }
};

// Get single order by ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("medicines.medicineId")
      .populate("mrName", "name")
      .exec();
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
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
