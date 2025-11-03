import { Request, Response } from "express";
import Doctor from "../models/doctorModel";
import csv from "csv-parser";
import fs from "fs";

const generateDocId = async (): Promise<string> => {
  let unique = false;
  let docId = "";

  while (!unique) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    docId = `DOC${randomNum}`;
    const existing = await Doctor.findOne({ docId });
    if (!existing) unique = true;
  }

  return docId;
};

export const addDoctor = async (req: Request, res: Response) => {
  try {
    const docId = await generateDocId();
    const doctor = new Doctor({ ...req.body, docId });
    await doctor.save();

    res.status(201).json({
      success: true,
      message: "Doctor added successfully",
      data: doctor,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add doctor",
    });
  }
};

// ✅ Get all doctors
export const getAllDoctors = async (req: Request, res: Response) => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch doctors",
    });
  }
};

// ✅ Get single doctor by ID
export const getDoctorById = async (req: Request, res: Response) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });

    res.status(200).json({ success: true, data: doctor });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch doctor",
    });
  }
};

// ✅ Update doctor
export const updateDoctor = async (req: Request, res: Response) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });

    res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      data: doctor,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update doctor",
    });
  }
};

// ✅ Delete doctor
export const deleteDoctor = async (req: Request, res: Response) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });

    res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete doctor",
    });
  }
};

export const uploadDoctorsCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const doctors = [];

    // ✅ Parse the CSV
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        doctors.push(row);
      })
      .on("end", async () => {
        let uploadedCount = 0;

        for (const doctor of doctors) {
          try {
            // check if already exists by name or email, etc.
            const exists = await Doctor.findOne({ name: doctor.name });
            if (!exists) {
              const newDoctor = new Doctor({
                name: doctor.name,
                specialization: doctor.specialization,
                city: doctor.city,
                phone: doctor.phone,
              });
              await newDoctor.save();
              uploadedCount++;
            }
          } catch (err) {
            console.error(`Failed to upload doctor: ${doctor.name}`, err);
          }
        }

        fs.unlinkSync(req.file.path); // cleanup uploaded file

        res.status(200).json({
          success: true,
          message: `${uploadedCount} doctors uploaded successfully!`,
          count: uploadedCount,
        });
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
