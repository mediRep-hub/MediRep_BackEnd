import { Request, Response } from "express";
import Brick, { IBrick } from "../models/brickModel";

// GET a specific brick by brickName (only return brickName)
export const getBrickByName = async (req: Request, res: Response) => {
  try {
    const { brickName } = req.params;

    if (!brickName) {
      return res.status(400).json({ message: "brickName is required" });
    }

    const brick = await Brick.findOne(
      { brickName }, // filter
      { brickName: 1, _id: 0 }, // only return brickName
    );

    if (!brick) {
      return res.status(404).json({ message: "Brick not found" });
    }

    res.json(brick);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err });
  }
};

// CREATE brick
export const createBrick = async (req: Request, res: Response) => {
  try {
    const { brickName, city, mrName, areas, pharmacies, doctors, products } =
      req.body;
    if (!brickName || !city || !mrName) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const newBrick: IBrick = new Brick({
      brickName,
      city,
      mrName,
      areas,
      pharmacies,
      doctors,
      products,
    });

    const savedBrick = await newBrick.save();
    res.status(201).json(savedBrick);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err });
  }
};

// UPDATE brick
export const updateBrick = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedBrick = await Brick.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedBrick)
      return res.status(404).json({ message: "Brick not found" });
    res.json(updatedBrick);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err });
  }
};

// DELETE brick
export const deleteBrick = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Brick.findByIdAndDelete(id);
    res.json({ message: "Brick deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err });
  }
};
