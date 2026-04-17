import Camp from "../models/campModel";

// ✅ CREATE CAMP
export const createCamp = async (req, res) => {
  try {
    const camp = await Camp.create({
      ...req.body,
      status: "pending", // 🔥 force default
    });

    res.status(201).json({
      success: true,
      message: "Camp created successfully",
      data: camp,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getAllCamps = async (req, res) => {
  try {
    const camps = await Camp.find()
      .populate("chemists")
      .populate("products.productId");

    const sorted = camps.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({
      success: true,
      data: sorted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const updateCampStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const allowedStatus = ["pending", "active", "completed", "cancelled"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const camp = await Camp.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!camp) {
      return res.status(404).json({
        success: false,
        message: "Camp not found",
      });
    }

    res.json({
      success: true,
      message: "Status updated successfully",
      data: camp,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
