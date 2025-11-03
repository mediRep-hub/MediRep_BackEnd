import { Request, Response } from "express";
import Doctor from "../models/doctorModel";
import { Readable } from "stream";
import csvParser from "csv-parser";

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
    // 🧩 Validate file presence
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results: any[] = [];
    const stream = Readable.from(req.file.buffer); // ✅ Use buffer — works on Vercel

    // 🧩 Parse CSV into results[]
    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on("data", (row) => results.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    if (results.length === 0) {
      return res.status(400).json({ message: "CSV is empty or invalid" });
    }

    // 🧩 Normalize & filter valid doctor rows
    const formattedDoctors: any[] = results
      .map((r) => ({
        name: r.name?.trim() || r.Name?.trim(),
        specialty: r.specialty?.trim() || r.Specialization?.trim() || "",
        email: r.email?.trim() || r.Email?.trim(),
        phone: r.phone?.trim() || r.Phone?.trim(),
        address: r.address?.trim() || r.Address?.trim(),
        startTime: r.startTime?.trim() || r.StartTime?.trim() || "",
        endTime: r.endTime?.trim() || r.EndTime?.trim() || "",
        region: r.region?.trim() || r.Region?.trim() || "",
        area: r.area?.trim() || r.Area?.trim() || "",
        affiliation: r.affiliation?.trim() || r.Affiliation?.trim() || "",
        image: r.image?.trim() || r.Image?.trim() || "",
      }))
      .filter((d) => !!d.name); // skip rows without a doctor name

    if (formattedDoctors.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid doctor records found in CSV" });
    }

    // 🧩 Insert into DB — allow partial success
    const inserted = await Doctor.insertMany(formattedDoctors, {
      ordered: false, // continue even if some fail (e.g., duplicates)
    });

    return res.status(201).json({
      success: true,
      uploaded: inserted.length,
      total: formattedDoctors.length,
      message: `✅ ${inserted.length} of ${formattedDoctors.length} doctors uploaded successfully!`,
    });
  } catch (err: any) {
    console.error("❌ Upload CSV error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to upload doctors",
    });
  }
};
