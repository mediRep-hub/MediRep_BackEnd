import SalesGroup from "../models/brickGroupModel";
import { SalesGroupValidation } from "../validations/brickGroupvalidation";

// Create new Sales Group
export const createSalesGroup = async (req, res) => {
  try {
    const { error } = SalesGroupValidation.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });

    const newGroup = new SalesGroup(req.body);
    await newGroup.save();
    res.status(201).json({ success: true, data: newGroup });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all Sales Groups
export const getAllSalesGroups = async (req, res) => {
  try {
    const groups = await SalesGroup.find().populate({
      path: "mr",
      select: "name position image",
      match: { position: "MedicalRep(MR)" }, // 🔥 filter here
    });

    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get single Sales Group by ID
export const getSalesGroupById = async (req, res) => {
  try {
    const group = await SalesGroup.findById(req.params.id);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    res.status(200).json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Sales Group
export const updateSalesGroup = async (req, res) => {
  try {
    const { error } = SalesGroupValidation.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });

    const updatedGroup = await SalesGroup.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedGroup)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    res.status(200).json({ success: true, data: updatedGroup });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Sales Group
export const deleteSalesGroup = async (req, res) => {
  try {
    const deletedGroup = await SalesGroup.findByIdAndDelete(req.params.id);
    if (!deletedGroup)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
