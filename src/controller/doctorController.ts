import { Request, Response } from "express";
import Doctor from "../models/doctorModel";
import { Readable } from "stream";
import csv from "csv-parser";
import axios from "axios";
import { validateDoctorData } from "../validations/doctorValidation";

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
  const { error } = validateDoctorData(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.message).join(", "),
    });
  }
  try {
    const docId = await generateDocId();
    const {
      name,
      specialty,
      email,
      phone,
      startTime,
      endTime,
      brick,
      city,
      affiliation,
      profileType,
      image,
      location,
    } = req.body;

    if (
      !location ||
      !location.address ||
      location.lat == null ||
      location.lng == null
    ) {
      return res.status(400).json({
        success: false,
        message: "Location with address, lat, and lng is required",
      });
    }
    const existingDoctor = await Doctor.findOne({
      $or: [{ name }, { email }, { phone }],
    });

    if (existingDoctor) {
      let conflictMsg = "";

      if (existingDoctor.name === name) conflictMsg = "Name already exists";
      else if (existingDoctor.email === email)
        conflictMsg = "Email already exists";
      else if (existingDoctor.phone === phone)
        conflictMsg = "Phone number already exists";

      return res.status(400).json({
        success: false,
        message: conflictMsg,
      });
    }

    const doctor = new Doctor({
      docId,
      name,
      specialty,
      email,
      phone,
      startTime,
      endTime,
      brick,
      city,
      affiliation,
      profileType,
      image,
      location,
    });

    await doctor.save();

    res.status(201).json({
      success: true,
      message: "Doctor added successfully",
      data: doctor,
    });
  } catch (error: any) {
    console.error("Add Doctor Error:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to add doctor",
    });
  }
};
// ✅ Get all doctors
export const getAllDoctorslist = async (req: Request, res: Response) => {
  try {
    const { city } = req.query; // get city from query params
    const filter: any = {};
    if (city && city !== "All") {
      filter.city = city; // filter by city if provided
    }

    const doctors = await Doctor.find(filter).sort({ createdAt: -1 });
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
  const { error } = validateDoctorData(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.message).join(", "),
    });
  }
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
  const { error } = validateDoctorData(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.message).join(", "),
    });
  }
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded." });
    }

    const rows = [];
    const stream = Readable.from(req.file.buffer);
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
    const doctorsWithData = await Promise.all(
      rows.map(async (r) => {
        const fullAddress =
          r.address || r.Address || r.location_address || r.Location || "";

        let lat = Number(r.location_lat) || 0;
        let lng = Number(r.location_lng) || 0;

        if ((!lat || !lng) && fullAddress) {
          try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              fullAddress
            )}&key=${apiKey}`;

            const response = await axios.get(url);

            if (response.data.results?.length > 0) {
              lat = response.data.results[0].geometry.location.lat;
              lng = response.data.results[0].geometry.location.lng;
            }
          } catch (err) {
            console.log("❌ Geocoding Error:", err.message);
          }
        }

        return {
          docId: r.docId || `DOC${Math.floor(1000 + Math.random() * 9000)}`,
          name: r.name || r.Name || "",
          specialty: r.specialty || r.Specialty || "",
          email: r.email || r.Email || "",
          phone: r.phone || r.Phone || "",
          startTime: r.startTime || r.StartTime || "",
          endTime: r.endTime || r.EndTime || "",
          brick: r.brick || r.brick || "",
          city: r.city || r.city || "",
          affiliation: r.affiliation || r.Affiliation || "",
          image: r.image || r.Image || "",
          location: {
            address: fullAddress,
            lat,
            lng,
          },
        };
      })
    );
    const inserted = await Doctor.insertMany(doctorsWithData, {
      ordered: false,
    });

    return res.status(201).json({
      success: true,
      message: `✅ ${inserted.length} records inserted successfully out of ${doctorsWithData.length}`,
    });
  } catch (err) {
    console.error("Upload CSV Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Upload failed",
    });
  }
};
