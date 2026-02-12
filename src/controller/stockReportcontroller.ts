import { Request, Response } from "express";
import mongoose, { Document, Model } from "mongoose";
import multer from "multer";
import fs from "fs";
import csv from "csv-parser";
import xlsx from "xlsx";
import pdfParse from "pdf-parse";
const pdfParse = require("pdf-parse").default;
// ---------------- Dynamic MongoDB schema ----------------
interface IStockReport extends Document {
  [key: string]: any;
}

const StockReportSchema = new mongoose.Schema(
  {},
  { strict: false, timestamps: true },
);

const StockReport: Model<IStockReport> =
  mongoose.models.StockReport ||
  mongoose.model<IStockReport>("StockReport", StockReportSchema);

// ---------------- Multer setup ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

export const upload = multer({ storage });

// ---------------- Helper: Clean Value ----------------
const cleanValue = (value: any) => {
  if (value === null || value === undefined) return "";

  if (typeof value === "object") {
    return Object.values(value).join(" ");
  }

  return String(value).trim();
};
const cleanHeader = (header: string) => {
  if (!header) return "";

  let h = header.toLowerCase().trim();

  // remove numbers
  h = h.replace(/\d+/g, "");

  // replace non letters/underscores with space
  h = h.replace(/[^a-z_]/g, " ");

  // remove trailing underscores
  h = h.replace(/_+$/g, "");

  // collapse multiple spaces
  h = h.replace(/\s+/g, " ").trim();

  // capitalize each word
  h = h.replace(/\b\w/g, (c) => c.toUpperCase());

  return h;
};

const normalizeParentRow = (row: any[]) => {
  const result: string[] = [];
  let last = "";

  for (const cell of row) {
    const val = String(cell || "").trim();
    if (val) {
      last = val;
      result.push(val);
    } else {
      result.push(last);
    }
  }

  return result;
};

const mergeHeaders = (row1: any[], row2: any[]) => {
  const titles: string[] = [];

  let currentParent = "";

  for (let i = 0; i < row1.length; i++) {
    const rawParent = String(row1[i] || "").trim();
    const rawChild = String(row2[i] || "").trim();

    if (rawParent) {
      currentParent = rawParent;
    }

    const parentClean = cleanHeader(currentParent);
    const childClean = cleanHeader(rawChild);

    if (parentClean && childClean && childClean !== parentClean) {
      titles.push(`${parentClean} ${childClean}`);
    } else if (parentClean && !childClean) {
      titles.push(parentClean);
    } else if (!parentClean && childClean) {
      titles.push(childClean);
    } else {
      titles.push(`Column ${i + 1}`);
    }
  }

  return titles;
};

// ---------------- Upload API ----------------
export const uploadStockFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const filePath = req.file.path;
    const mimetype = req.file.mimetype;

    let titles: string[] = [];
    let rowsToInsert: any[] = [];
    let data: any[] = [];

    if (mimetype === "text/csv") {
      const allRows: any[] = [];

      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ headers: false }))
          .on("data", (row) => {
            allRows.push(Object.values(row));
          })
          .on("end", resolve)
          .on("error", reject);
      });

      if (allRows.length >= 2) {
        const headerRow1 = allRows[0] as string[];
        const headerRow2 = allRows[1] as string[];

        titles = mergeHeaders(headerRow1, headerRow2);

        const bodyRows = allRows.slice(2);

        rowsToInsert = bodyRows.map((row: any[]) => {
          const obj: any = {};
          titles.forEach((title, i) => {
            obj[title] = cleanValue(row[i]);
          });
          return obj;
        });

        data = rowsToInsert.map((r) => titles.map((t) => r[t] ?? ""));
      }
    } else if (
      mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimetype === "application/vnd.ms-excel"
    ) {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rawData: any[][] = xlsx.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
      });

      if (rawData.length >= 2) {
        const headerRow1 = rawData[0];
        const headerRow2 = rawData[1];

        titles = mergeHeaders(headerRow1, headerRow2);

        const bodyRows = rawData.slice(2);

        rowsToInsert = bodyRows.map((row) => {
          const obj: any = {};
          titles.forEach((title, i) => {
            obj[title] = cleanValue(row[i]);
          });
          return obj;
        });

        data = rowsToInsert.map((r) => titles.map((t) => r[t] ?? ""));
      }
    } else if (mimetype === "application/pdf") {
      const buffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(buffer);

      const lines = pdfData.text.split("\n").filter((l) => l.trim() !== "");

      if (lines.length >= 2) {
        const headerRow1 = lines[0].split(/\s+/);
        const headerRow2 = lines[1].split(/\s+/);

        titles = mergeHeaders(headerRow1, headerRow2);

        const bodyRows = lines.slice(2);

        rowsToInsert = bodyRows.map((line) => {
          const columns = line.split(/\s+/);
          const obj: any = {};

          titles.forEach((title, i) => {
            obj[title] = cleanValue(columns[i]);
          });

          return obj;
        });

        data = rowsToInsert.map((r) => titles.map((t) => r[t] ?? ""));
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Unsupported file type",
      });
    }
    if (rowsToInsert.length) {
      await StockReport.insertMany(rowsToInsert);
    }

    fs.unlinkSync(filePath);

    return res.status(200).json({
      success: true,
      message: `${rowsToInsert.length} records inserted successfully`,
      titles,
      data,
    });
  } catch (err: any) {
    console.error("Upload Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ---------------- GET API ----------------
export const getAllStockReports = async (req: Request, res: Response) => {
  try {
    const reports = await StockReport.find().sort({ createdAt: -1 }).lean();

    if (!reports.length) {
      return res.status(200).json({
        titles: [],
        data: [],
        message: "No records found",
      });
    }

    const allKeys = new Set<string>();

    reports.forEach((doc) =>
      Object.keys(doc).forEach((k) => {
        if (
          k !== "_id" &&
          k !== "__v" &&
          k !== "createdAt" &&
          k !== "updatedAt"
        )
          allKeys.add(k);
      }),
    );

    const titles = Array.from(allKeys);

    const data = reports.map((doc) => titles.map((key) => doc[key] ?? ""));

    return res.status(200).json({
      titles,
      data,
      message: "Records fetched successfully",
    });
  } catch (error: any) {
    console.error("Get Stock Reports Error:", error);
    return res.status(500).json({
      message: error.message || "Error fetching reports",
    });
  }
};
