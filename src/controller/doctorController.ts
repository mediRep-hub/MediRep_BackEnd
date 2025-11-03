import { Request, Response } from "express";
import Doctor from "../models/doctorModel";
import csv from "csv-parser";
import { Readable } from "stream";

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

export const uploadDoctorsCSV = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results: any[] = [];
    const stream = Readable.from(req.file.buffer); // ✅ Use buffer directly

    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csv())
        .on("data", (row) => results.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    if (!results.length) {
      return res.status(400).json({ message: "CSV is empty" });
    }

    // ✅ Normalize and validate
    const formattedDoctors: any[] = [];
    for (const r of results) {
      if (!r.name && !r.Name) continue; // skip invalid rows

      formattedDoctors.push({
        name: r.name || r.Name,
        specialty: r.specialty || r.Specialization || "",
        email: r.email || r.Email,
        phone: r.phone || r.Phone || "",
        address: r.address || r.Address || "",
        startTime: r.startTime || r.StartTime || "",
        endTime: r.endTime || r.EndTime || "",
        region: r.region || r.Region || "",
        area: r.area || r.Area || "",
        affiliation: r.affiliation || r.Affiliation || "",
        image: r.image || r.Image || "",
      });
    }

    if (!formattedDoctors.length) {
      return res
        .status(400)
        .json({ message: "No valid doctor records found in CSV." });
    }

    await Doctor.insertMany(formattedDoctors, { ordered: false });

    return res.status(201).json({
      success: true,
      message: `${formattedDoctors.length} doctors uploaded successfully!`,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Upload failed",
    });
  }
};
