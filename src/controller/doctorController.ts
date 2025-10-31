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
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const results: any[] = [];
    const readable = Readable.from(req.file.buffer);

    readable
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", async () => {
        const doctorsToAdd = [];

        for (const row of results) {
          const {
            name,
            specialty,
            email,
            phone,
            address,
            startTime,
            endTime,
            region,
            area,
            affiliation,
            image,
          } = row;

          if (!name || !email || !specialty) continue;

          const docId = await generateDocId();

          doctorsToAdd.push({
            docId,
            name: name.trim(),
            specialty: specialty.trim(),
            email: email.trim(),
            phone: phone?.trim() || "",
            address: address?.trim() || "",
            startTime: startTime?.trim() || "",
            endTime: endTime?.trim() || "",
            region: region?.trim() || "",
            area: area?.trim() || "",
            affiliation: affiliation?.trim() || "",
            image: image?.trim() || "",
          });
        }

        if (doctorsToAdd.length === 0)
          return res
            .status(400)
            .json({ message: "No valid doctor data found in CSV" });

        const createdDoctors = await Doctor.insertMany(doctorsToAdd);

        res.status(201).json({
          success: true,
          message: `${createdDoctors.length} doctors added successfully`,
          data: createdDoctors,
        });
      });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || "Failed to upload CSV" });
  }
};
