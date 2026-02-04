import { Request, Response } from "express";
import Group from "../models/brickGroupModel"; // default import
import { validateGroup } from "../validations/brickGroupvalidation";

// ---------------- Controllers ----------------

// GET all groups
export const getAllGroups = async (req: Request, res: Response) => {
  try {
    const { groupName } = req.query;

    let groups;

    if (groupName) {
      groups = await Group.find({
        groupName: { $regex: new RegExp(String(groupName), "i") },
      }).populate("mr", "name email role");

      if (!groups || groups.length === 0) {
        return res.status(404).json({ message: "Group not found" });
      }
    } else {
      // Return all groups
      groups = await Group.find().populate("mr", "name email role");
    }

    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err });
  }
};

// GET group by ID
export const getGroupById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err });
  }
};

// CREATE group
export const createGroup = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error } = validateGroup(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation Error",
        details: error.details.map((d) => d.message),
      });
    }

    const newGroup = new Group(req.body);
    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err });
  }
};

// UPDATE group
export const updateGroup = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error } = validateGroup(req.body);
    if (error)
      return res.status(400).json({
        message: "Validation Error",
        details: error.details.map((d) => d.message),
      });

    const { id } = req.params;
    const updatedGroup = await Group.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedGroup)
      return res.status(404).json({ message: "Group not found" });

    res.json(updatedGroup);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err });
  }
};

// DELETE group
export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedGroup = await Group.findByIdAndDelete(id);
    if (!deletedGroup)
      return res.status(404).json({ message: "Group not found" });

    res.json({ message: "Group deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err });
  }
};
