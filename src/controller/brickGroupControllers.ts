import { Request, Response } from "express";
import Group, { IGroup } from "../models/brickGroupModel";
import Admin from "../models/admin"; // your Admin model

export const getAllGroups = async (req: Request, res: Response) => {
  try {
    const { groupName } = req.query;

    let groups;

    if (groupName) {
      groups = await Group.find({
        groupName: { $regex: new RegExp(String(groupName), "i") },
      }).populate("mr", "name"); // populate only name
    } else {
      groups = await Group.find().populate("mr", "name"); // populate only name
    }

    // Send MR names instead of object with _id
    const formattedGroups = groups.map((group) => ({
      ...group.toObject(),
      mr: group.mr.map((mr: any) => mr.name), // replace mr array with names
    }));

    res.json(formattedGroups);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Convert MR names to IDs
    const mrDocs = await Admin.find({ name: { $in: data.mrName } }).select(
      "_id",
    );
    const mrIds = mrDocs.map((doc) => doc._id);

    const newGroup = new Group({
      ...data,
      mr: mrIds, // save ObjectIds in DB
    });

    await newGroup.save();

    res
      .status(201)
      .json({ message: "Group added successfully", group: newGroup });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err });
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // change from groupId to id
    const data = req.body;

    // Convert MR names to IDs
    const mrDocs = await Admin.find({ name: { $in: data.mrName } }).select(
      "_id",
    );
    const mrIds = mrDocs.map((doc) => doc._id);

    const updatedGroup = await Group.findByIdAndUpdate(
      id, // Use _id here
      { ...data, mr: mrIds },
      { new: true },
    );

    if (!updatedGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json({ message: "Group updated successfully", group: updatedGroup });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err });
  }
};

// DELETE /api/groups/:groupId
export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // send _id from frontend

    const group = await Group.findById(id); // use _id
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    await group.deleteOne();

    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err });
  }
};
