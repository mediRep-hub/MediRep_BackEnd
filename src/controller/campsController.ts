import Camp from "../models/campModel";

export const createCamp = async (req, res) => {
  try {
    const camp = await Camp.create({
      ...req.body,
      status: "pending", // 🔥 force default
    });

    res.status(201).json({
      success: true,
      message: "Camp created successfully",
      data: camp,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllCamps = async (req, res) => {
  try {
    const camps = await Camp.find()
      .populate("doctors")
      .populate("chemists")
      .populate({
        path: "products.productId",
        select:
          "productName category isfrom amount productImage strength isStatus sku packSize achievement target",
      });

    const sorted = camps.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({
      success: true,
      data: sorted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const updateCampStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const allowedStatus = ["pending", "approved", "completed", "rejected"];

    const newStatus = status.toLowerCase().trim();

    if (!allowedStatus.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({
        success: false,
        message: "Camp not found",
      });
    }

    const currentStatus = camp.status;

    const rules = {
      pending: ["approved", "rejected"],
      approved: ["completed"],
      completed: [],
      rejected: [],
    };

    if (!rules[currentStatus]?.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from "${currentStatus}" to "${newStatus}"`,
      });
    }

    camp.status = newStatus;
    await camp.save();

    return res.json({
      success: true,
      message: "Status updated successfully",
      data: camp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addPatientsToCamp = async (req, res) => {
  try {
    const { patients } = req.body;

    if (!Array.isArray(patients) || patients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Patients array is required",
      });
    }

    for (const p of patients) {
      if (
        !p.name ||
        !p.patientId ||
        !p.gender ||
        p.weight === undefined ||
        p.age === undefined ||
        !p.sampleDate
      ) {
        return res.status(400).json({
          success: false,
          message: "All patient fields are required",
        });
      }

      // ✅ convert date safely
      p.sampleDate = new Date(p.sampleDate);
    }

    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({
        success: false,
        message: "Camp not found",
      });
    }

    camp.patients.push(...(patients as any));
    await camp.save();

    return res.json({
      success: true,
      message: "Patients added successfully",
      data: camp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

interface ICamp {
  campType: string;
  sampleType: string;
  campTime: string;
  campStartDate: Date;
  campEndDate: Date;
  mrName: string;
  brickCode: string;
  status: "pending" | "approved" | "completed" | "rejected";
  patients: any[];
  doctors: any[];
  chemists: any[];
  products: { productId: string; quantity: number }[];
}

// -----------------------------
// MAIN CONTROLLER
// -----------------------------
export const getCampDashboardAnalytics = async (req, res) => {
  try {
    const {
      from,
      to,
      month,
      year,
      status,
      brickCode,
      campType,
      sampleType,
      doctor,
      chemist,
    } = req.query;

    // -----------------------------
    // DATE FILTER
    // -----------------------------
    const dateFilter: any = {};

    if (from && to) {
      dateFilter.campStartDate = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0);

      dateFilter.campStartDate = {
        $gte: start,
        $lte: end,
      };
    }

    // -----------------------------
    // MAIN FILTER
    // -----------------------------
    const filter: any = {
      ...dateFilter,
    };

    if (status) filter.status = status;
    if (brickCode) filter.brickCode = brickCode;
    if (campType) filter.campType = campType;
    if (sampleType) filter.sampleType = sampleType;
    if (doctor) filter.doctors = doctor;
    if (chemist) filter.chemists = chemist;

    // -----------------------------
    // FETCH DATA
    // -----------------------------
    const camps = await Camp.find(filter)
      .populate("chemists")
      .populate("doctors")
      .lean<ICamp[]>();

    // -----------------------------
    // STATS VARIABLES
    // -----------------------------
    let planned = 0;
    let executed = 0;

    let totalApproved = 0;
    let totalCompleted = 0;
    let totalPending = 0;
    let totalRejected = 0;

    const doctorSet = new Set();
    const chemistSet = new Set();
    const brickSet = new Set();
    const productSet = new Set();

    let totalPatients = 0;

    const totalCamps = camps.length;

    // -----------------------------
    // BAR DATA
    // -----------------------------
    const brickMap: any = {};

    // -----------------------------
    // LOOP
    // -----------------------------
    camps.forEach((camp: ICamp) => {
      const statusVal = camp.status?.toLowerCase();
      const brick = camp.brickCode || "Unknown";

      // STATUS COUNTS
      if (statusVal === "approved") {
        totalApproved++;
        planned++;
      }

      if (statusVal === "completed") {
        totalCompleted++;
        planned++;
        executed++;
      }

      if (statusVal === "pending") totalPending++;
      if (statusVal === "rejected") totalRejected++;

      // DOCTORS
      camp.doctors?.forEach((d: any) => doctorSet.add(String(d._id)));

      // CHEMISTS
      camp.chemists?.forEach((c: any) => chemistSet.add(String(c._id)));

      // PRODUCTS
      camp.products?.forEach((p: any) => productSet.add(String(p.productId)));

      // BRICKS
      if (camp.brickCode) brickSet.add(camp.brickCode);

      // PATIENTS
      totalPatients += camp.patients?.length || 0;

      // -----------------------------
      // BAR CHART LOGIC
      // -----------------------------
      if (!brickMap[brick]) {
        brickMap[brick] = {
          name: brick,
          planned: 0,
          executed: 0,
        };
      }

      if (statusVal === "approved" || statusVal === "completed") {
        brickMap[brick].planned += 1;
      }

      if (statusVal === "completed") {
        brickMap[brick].executed += 1;
      }
    });

    const barData = Object.values(brickMap);

    // -----------------------------
    // RESPONSE
    // -----------------------------
    res.json({
      success: true,
      data: {
        totalCamps,

        plannedCamps: planned,
        executedCamps: executed,

        totalApproved,
        totalCompleted,
        totalPending,
        totalRejected,

        totalDoctors: doctorSet.size,
        totalChemists: chemistSet.size,
        totalProducts: productSet.size,
        totalTerritories: brickSet.size,
        totalPatients,

        barData,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
