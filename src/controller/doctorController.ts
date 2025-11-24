import { Request, Response } from "express";
import Doctor from "../models/doctorModel";
import { Readable } from "stream";
import csv from "csv-parser";
import axios from "axios";

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

    // ---------------------------
    // 1️⃣ Get lat/lng from address
    // ---------------------------
    const apiKey = "AIzaSyBrNjsUsrJ0Mmjhe-WUKDKVaIsMkZ8iQ4A";

    const geoURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      req.body.address
    )}&key=${apiKey}`;

    const geoRes = await axios.get(geoURL);

    let lat = 0;
    let lng = 0;

    if (geoRes.data.status === "OK" && geoRes.data.results.length > 0) {
      lat = geoRes.data.results[0].geometry.location.lat;
      lng = geoRes.data.results[0].geometry.location.lng;
    }

    // ---------------------------
    // 2️⃣ Save doctor with location
    // ---------------------------
    const doctor = new Doctor({
      ...req.body,
      docId,
      location: {
        lat,
        lng,
      },
    });

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
export const getAllDoctorslist = async (req: Request, res: Response) => {
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

// ✅ Get all doctors with pagination
export const getAllDoctors = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;
    const skip = (page - 1) * limit;

    const totalDoctors = await Doctor.countDocuments();
    const doctors = await Doctor.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      total: totalDoctors,
      page,
      pages: Math.ceil(totalDoctors / limit),
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

export const uploadCSVDoctor = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded." });
    }

    const rows = [];
    const stream = Readable.from(req.file.buffer);

    // Read CSV
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on("data", (row) => rows.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "CSV is empty",
      });
    }

    const apiKey = "AIzaSyBrNjsUsrJ0Mmjhe-WUKDKVaIsMkZ8iQ4A";

    // Convert address → lat/lng
    const doctorsWithData = await Promise.all(
      rows.map(async (r) => {
        const address =
          r.address || r.Address || r.Location || r.location || "";

        let lat = 0;
        let lng = 0;

        if (address) {
          try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              address
            )}&key=${apiKey}`;

            const response = await axios.get(url);

            if (response.data.results && response.data.results.length > 0) {
              lat = response.data.results[0].geometry.location.lat;
              lng = response.data.results[0].geometry.location.lng;
            }
          } catch (err) {
            console.error("Geocoding error:", err.message);
          }
        }

        return {
          docId: `DOC${Math.floor(1000 + Math.random() * 9000)}`,
          name: r.name || r.Name || "",
          specialty: r.specialty || r.Specialty || "",
          email: r.email || r.Email || "",
          phone: r.phone || r.Phone || "",
          address,
          startTime: r.startTime || r.StartTime || "",
          endTime: r.endTime || r.EndTime || "",
          region: r.region || r.Region || "",
          area: r.area || r.Area || "",
          affiliation: r.affiliation || r.Affiliation || "",
          image: r.image || r.Image || "",
          location: { lat, lng },
        };
      })
    );

    const inserted = await Doctor.insertMany(doctorsWithData, {
      ordered: false,
    });

    return res.status(201).json({
      success: true,
      message: `✅ ${inserted.length} of ${doctorsWithData.length} doctors uploaded successfully!`,
    });
  } catch (err) {
    console.error("Upload CSV Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Upload failed",
    });
  }
};
