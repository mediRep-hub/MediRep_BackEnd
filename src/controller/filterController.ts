// controllers/filterController.ts
import { Request, Response } from "express";
import { Order } from "../models/orderModel";
import Product from "../models/productModel";
import Requisition from "../models/requisitionModel";
import CallReporting from "../models/callReportingModel";
import Admin from "../models/admin";

export const fetchWithFilters = async (req: Request, res: Response) => {
  try {
    const { resource, filters, page = 1, limit = 10 } = req.body;

    let query: any = {};

    // Define models and their filter field mapping
    let Model: any;
    let fieldMap: any = {};

    switch ((resource || "").toLowerCase()) {
      case "orders":
        Model = Order;
        fieldMap = { mr: "mrName", area: "area", date: "createdAt" };
        break;
      case "products":
        Model = Product;
        fieldMap = { date: "createdAt" }; // products may not have MR/area
        break;
      case "requisition":
      case "requisitions":
        Model = Requisition;
        fieldMap = { mr: "mrName", area: "area", date: "createdAt" };
        break;
      case "callreporting":
      case "callreportings":
        Model = CallReporting;
        fieldMap = { mr: "mrName", area: "area", date: "createdAt" };
        break;
      default:
        return res.status(400).json({ message: "Invalid resource" });
    }

    // Apply filters dynamically
    if (filters) {
      // MR filter
      if (filters.mr && fieldMap.mr) {
        if (resource.toLowerCase().includes("callreport")) {
          // CallReporting: mrName is ObjectId, search Admin collection
          const matchingMRs = await Admin.find({
            name: { $regex: filters.mr, $options: "i" },
          }).select("_id");
          const mrIds = matchingMRs.map((mr) => mr._id);
          query[fieldMap.mr] = { $in: mrIds };
        } else {
          query[fieldMap.mr] = { $regex: filters.mr, $options: "i" };
        }
      }

      // Area filter
      if (filters.area && fieldMap.area) {
        query[fieldMap.area] = { $regex: filters.area, $options: "i" };
      }

      // Date filter
      if (filters.startDate && filters.endDate && fieldMap.date) {
        query[fieldMap.date] = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        };
      }
    }

    const totalItems = await Model.countDocuments(query);
    const data = await Model.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.status(200).json({
      data,
      pagination: { currentPage: page, totalItems, itemsPerPage: limit },
    });
  } catch (err) {
    console.error("FetchWithFilters Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
