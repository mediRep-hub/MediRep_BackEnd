import { Request, Response } from "express";
import Pharmacy from "../models/phramacyModel";
import { Readable } from "stream";
import csv from "csv-parser";
import axios from "axios";
import { validatePharmacyData } from "../validations/pharmacyValidation";

const generatePharmacyId = async (): Promise<string> => {
  let unique = false;
  let pharmacyId = "";

  while (!unique) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    pharmacyId = `PHA${randomNum}`;
    const existing = await Pharmacy.findOne({ pharmacyId });
    if (!existing) unique = true;
  }

  return pharmacyId;
};

export const addPharmacy = async (req: Request, res: Response) => {
  const { error } = validatePharmacyData(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.message).join(", "),
    });
  }
  try {
    const pharmacyId = await generatePharmacyId();

    const {
      name,
      specialty,
      email,
      phone,
      startTime,
      endTime,
      brick,
      DSL,
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

    const pharmacy = new Pharmacy({
      pharmacyId,
      name,
      specialty,
      email,
      phone,
      startTime,
      endTime,
      DSL,
      brick,
      city,
      affiliation,
      profileType,
      image,
      location,
    });

    await pharmacy.save();

    res.status(201).json({
      success: true,
      message: "Pharmacy added successfully",
      data: pharmacy,
    });
  } catch (error: any) {
    console.error("Add Pharmacy Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add pharmacy",
    });
  }
};

// ✅ Get all pharmacies
export const getAllPharmaciesList = async (req: Request, res: Response) => {
  try {
    const pharmacies = await Pharmacy.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: pharmacies.length,
      data: pharmacies,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch pharmacies",
    });
  }
};

// ✅ Get all pharmacies with pagination
export const getAllPharmacies = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;
    const skip = (page - 1) * limit;

    const totalPharmacies = await Pharmacy.countDocuments();
    const pharmacies = await Pharmacy.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      total: totalPharmacies,
      page,
      pages: Math.ceil(totalPharmacies / limit),
      count: pharmacies.length,
      data: pharmacies,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch pharmacies",
    });
  }
};

// ✅ Get single pharmacy by ID
export const getPharmacyById = async (req: Request, res: Response) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy)
      return res
        .status(404)
        .json({ success: false, message: "Pharmacy not found" });

    res.status(200).json({ success: true, data: pharmacy });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch pharmacy",
    });
  }
};

// ✅ Update pharmacy
export const updatePharmacy = async (req: Request, res: Response) => {
  const { error } = validatePharmacyData(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.message).join(", "),
    });
  }
  try {
    const pharmacy = await Pharmacy.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!pharmacy)
      return res
        .status(404)
        .json({ success: false, message: "Pharmacy not found" });

    res.status(200).json({
      success: true,
      message: "Pharmacy updated successfully",
      data: pharmacy,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update pharmacy",
    });
  }
};

// ✅ Delete pharmacy
export const deletePharmacy = async (req: Request, res: Response) => {
  try {
    const pharmacy = await Pharmacy.findByIdAndDelete(req.params.id);
    if (!pharmacy)
      return res
        .status(404)
        .json({ success: false, message: "Pharmacy not found" });

    res.status(200).json({
      success: true,
      message: "Pharmacy deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete pharmacy",
    });
  }
};

// ✅ Upload CSV for pharmacies
export const uploadCSVPharmacy = async (req, res) => {
  const { error } = validatePharmacyData(req.body);
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

    const pharmaciesWithData = await Promise.all(
      rows.map(async (r) => {
        const fullAddress =
          r.address || r.Address || r.location_address || r.Location || "";

        let lat = Number(r.location_lat) || 0;
        let lng = Number(r.location_lng) || 0;

        if ((!lat || !lng) && fullAddress) {
          try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              fullAddress,
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
          pharmacyId:
            r.pharmacyId || `PHA${Math.floor(1000 + Math.random() * 9000)}`,
          name: r.name || r.Name || "",
          specialty: r.specialty || r.Specialty || "",
          email: r.email || r.Email || "",
          phone: r.phone || r.Phone || "",
          startTime: r.startTime || r.StartTime || "",
          endTime: r.endTime || r.EndTime || "",
          brick: r.brick || r.brick || "",
          city: r.city || r.city || "",
          DSL: r.DSL || r.DSL || "",
          affiliation: r.affiliation || r.Affiliation || "",
          image: r.image || r.Image || "",
          location: {
            address: fullAddress,
            lat,
            lng,
          },
        };
      }),
    );

    const inserted = await Pharmacy.insertMany(pharmaciesWithData, {
      ordered: false,
    });

    return res.status(201).json({
      success: true,
      message: `✅ ${inserted.length} records inserted successfully out of ${pharmaciesWithData.length}`,
    });
  } catch (err) {
    console.error("Upload CSV Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Upload failed",
    });
  }
};
