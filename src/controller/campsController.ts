import mongoose from "mongoose";
import Camp from "../models/campModel";
import { sendNotification } from "../utils/notifications";
import Admin from "../models/admin";

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
      return res
        .status(400)
        .json({ success: false, message: "Status is required" });
    }

    const allowedStatus = ["pending", "approved", "completed", "rejected"];
    const newStatus = status.toLowerCase().trim();

    if (!allowedStatus.includes(newStatus)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    const camp = await Camp.findById(req.params.id).populate("user");

    if (!camp) {
      return res
        .status(404)
        .json({ success: false, message: "Camp not found" });
    }

    const rules = {
      pending: ["approved", "rejected"],
      approved: ["completed"],
      completed: [],
      rejected: [],
    };

    if (!rules[camp.status]?.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from "${camp.status}" to "${newStatus}"`,
      });
    }

    const updatedCamp = await Camp.findByIdAndUpdate(
      req.params.id,
      { status: newStatus },
      { new: true },
    ).populate("user"); // ← this is the user who CREATED the camp

    // ── Get the creator of the camp ──────────────────────────
    const campCreator = (updatedCamp as any).user;

    console.log("🔔 Notification flow start");
    console.log("👤 Camp Creator ID  :", campCreator?._id);
    console.log("👤 Camp Creator Name:", campCreator?.name);
    console.log("📱 FCM Token        :", campCreator?.fcmToken);

    // ── Send notification to the camp creator ────────────────
    if (campCreator?.fcmToken) {
      try {
        const statusMessages: Record<string, { title: string; body: string }> =
          {
            approved: {
              title: "🎉 Camp Approved!",
              body: "Your camp request has been approved by admin.",
            },
            rejected: {
              title: "❌ Camp Rejected",
              body: "Your camp request has been rejected by admin.",
            },
            completed: {
              title: "✅ Camp Completed",
              body: "Your camp has been marked as completed.",
            },
            pending: {
              title: "⏳ Camp Pending",
              body: "Your camp request is under review.",
            },
          };

        const { title, body } = statusMessages[newStatus] ?? {
          title: "Camp Status Updated",
          body: `Your camp status has been changed to ${newStatus}.`,
        };

        await sendNotification(campCreator.fcmToken, title, body, {
          campId: updatedCamp._id.toString(),
          status: newStatus,
        });

        console.log("✅ Notification sent to camp creator:", campCreator._id);
      } catch (err) {
        console.error("❌ Notification failed:", err);
      }
    } else {
      console.log(
        "⏭️  Skipped — camp creator has no FCM token. Creator ID:",
        campCreator?._id,
      );
    }

    console.log("🔔 Notification flow end");

    return res.json({
      success: true,
      message: "Status updated successfully",
      data: updatedCamp,
    });
  } catch (error) {
    console.error("❌ updateCampStatus error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addPatientsToCamp = async (req, res) => {
  try {
    const { patients } = req.body;

    patients.forEach((p) => {
      const timePart = Date.now().toString().slice(-5); // last 5 digits
      const randPart = Math.floor(Math.random() * 100); // 2 digits
      p.patientId = `PID-${timePart}${randPart}`;
    });

    if (!Array.isArray(patients) || patients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Patients array is required",
      });
    }

    for (const p of patients) {
      if (
        !p.name ||
        !p.gender ||
        p.weight === undefined ||
        p.age === undefined ||
        !p.sampleDate ||
        !p.contactNo ||
        !p.address
      ) {
        return res.status(400).json({
          success: false,
          message: "All patient fields are required",
        });
      }

      const parsedDate = new Date(p.sampleDate);

      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid sampleDate format",
        });
      }
    }

    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({
        success: false,
        message: "Camp not found",
      });
    }

    camp.patients.push(...patients);

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

// export const getCampDashboardAnalytics = async (req, res) => {
//   try {
//     const {
//       from,
//       to,
//       month,
//       year,
//       brickCode,
//       campType,
//       sampleType,
//       doctor,
//       chemist,
//       product,
//     } = req.query;

//     // -----------------------------
//     // CLEAN HELPER
//     // -----------------------------
//     const clean = (val: any) =>
//       val && val !== "undefined" && val !== "null" && val !== "";

//     // -----------------------------
//     // DATE FILTER
//     // -----------------------------
//     const dateFilter: any = {};

//     if (clean(from) && clean(to)) {
//       dateFilter.campStartDate = {
//         $gte: new Date(from),
//         $lte: new Date(to),
//       };
//     }

//     if (clean(month) && clean(year)) {
//       const start = new Date(Number(year), Number(month) - 1, 1);
//       const end = new Date(Number(year), Number(month), 0);

//       dateFilter.campStartDate = {
//         $gte: start,
//         $lte: end,
//       };
//     }

//     const filter: any = { ...dateFilter };

//     if (clean(brickCode)) filter.brickCode = brickCode;
//     if (clean(campType)) filter.campType = campType;
//     if (clean(sampleType)) filter.sampleType = sampleType;

//     if (clean(doctor)) {
//       filter.doctors = { $in: [doctor] };
//     }

//     if (clean(chemist)) {
//       filter.chemists = { $in: [chemist] };
//     }

//     if (clean(product)) {
//       filter.products = {
//         $elemMatch: {
//           productId: product,
//         },
//       };
//     }
//     // -----------------------------
//     // FETCH DATA
//     // -----------------------------
//     const camps = await Camp.find(filter)
//       .populate("chemists")
//       .populate("doctors")
//       .populate("products.productId")
//       .lean<ICamp[]>();

//     // -----------------------------
//     // STATS
//     // -----------------------------
//     let planned = 0;
//     let executed = 0;

//     let totalApproved = 0;
//     let totalCompleted = 0;
//     let totalPending = 0;
//     let totalRejected = 0;

//     const doctorSet = new Set<string>();
//     const chemistSet = new Set<string>();
//     const productSet = new Set<string>();
//     const brickSet = new Set<string>();

//     let totalPatients = 0;

//     const brickMap: Record<string, any> = {};

//     camps.forEach((camp: ICamp) => {
//       const statusVal = camp.status?.toLowerCase();
//       const brick = camp.brickCode || "Unknown";

//       // -----------------------------
//       // STATUS LOGIC (NO FILTER ANYMORE)
//       // -----------------------------
//       if (statusVal === "approved") {
//         totalApproved++;
//         planned++;
//       }

//       if (statusVal === "completed") {
//         totalCompleted++;
//         executed++;
//         planned++; // completed also counts in planned
//       }

//       if (statusVal === "pending") totalPending++;
//       if (statusVal === "rejected") totalRejected++;

//       // -----------------------------
//       // RELATIONS
//       // -----------------------------
//       camp.doctors?.forEach((d: any) => doctorSet.add(String(d._id)));
//       camp.chemists?.forEach((c: any) => chemistSet.add(String(c._id)));

//       camp.products?.forEach((p: any) =>
//         productSet.add(String(p.productId?._id || p.productId)),
//       );

//       if (camp.brickCode) brickSet.add(camp.brickCode);

//       totalPatients += camp.patients?.length || 0;

//       // -----------------------------
//       // BAR DATA
//       // -----------------------------
//       if (!brickMap[brick]) {
//         brickMap[brick] = {
//           name: brick,
//           planned: 0,
//           executed: 0,
//         };
//       }

//       if (statusVal === "approved") {
//         brickMap[brick].planned += 1;
//       }

//       if (statusVal === "completed") {
//         brickMap[brick].executed += 1;
//       }
//     });

//     const barData = Object.values(brickMap);

//     // -----------------------------
//     // RESPONSE
//     // -----------------------------
//     return res.status(200).json({
//       success: true,
//       data: {
//         totalCamps: camps.length,

//         plannedCamps: planned,
//         executedCamps: executed,

//         totalApproved,
//         totalCompleted,
//         totalPending,
//         totalRejected,

//         totalDoctors: doctorSet.size,
//         totalChemists: chemistSet.size,
//         totalProducts: productSet.size,
//         totalTerritories: brickSet.size,
//         totalPatients,

//         barData,
//       },
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const getCampDashboardAnalytics = async (req, res) => {
  try {
    const {
      from,
      to,
      month,
      year,
      brickCode,
      campType,
      sampleType,
      doctor,
      chemist,
      product,
    } = req.query;

    const clean = (val: any) =>
      val && val !== "undefined" && val !== "null" && val !== "";

    // -----------------------------
    // DATE FILTER
    // -----------------------------
    const dateFilter: any = {};

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (clean(from) && clean(to)) {
      startDate = new Date(from);
      endDate = new Date(to);

      dateFilter.campStartDate = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    if (clean(month) && clean(year)) {
      startDate = new Date(Number(year), Number(month) - 1, 1);
      endDate = new Date(Number(year), Number(month), 0);

      dateFilter.campStartDate = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // -----------------------------
    // FILTER
    // -----------------------------
    const filter: any = { ...dateFilter };

    if (clean(brickCode)) filter.brickCode = brickCode;
    if (clean(campType)) filter.campType = campType;
    if (clean(sampleType)) filter.sampleType = sampleType;

    if (clean(doctor)) {
      filter.doctors = { $in: [new mongoose.Types.ObjectId(doctor)] };
    }

    if (clean(chemist)) {
      filter.chemists = { $in: [new mongoose.Types.ObjectId(chemist)] };
    }

    if (clean(product)) {
      filter.products = {
        $elemMatch: {
          productId: new mongoose.Types.ObjectId(product),
        },
      };
    }

    // -----------------------------
    // CURRENT DATA
    // -----------------------------
    const camps = await Camp.find(filter)
      .populate("chemists")
      .populate("doctors")
      .populate("products.productId")
      .lean();

    // -----------------------------
    // PREVIOUS DATA
    // -----------------------------
    let prevFilter: any = {};

    if (startDate && endDate) {
      const diff = endDate.getTime() - startDate.getTime();

      const prevStart = new Date(startDate.getTime() - diff - 1);
      const prevEnd = new Date(startDate.getTime() - 1);

      prevFilter.campStartDate = {
        $gte: prevStart,
        $lte: prevEnd,
      };

      if (clean(brickCode)) prevFilter.brickCode = brickCode;
      if (clean(campType)) prevFilter.campType = campType;
      if (clean(sampleType)) prevFilter.sampleType = sampleType;
    }

    const prevCamps = await Camp.find(prevFilter).lean();

    // -----------------------------
    // STATS CALC
    // -----------------------------

    const countStats = (data: any[]) => {
      let planned = 0;
      let executed = 0;
      let approved = 0;
      let pending = 0;
      let rejected = 0;

      const doctorSet = new Set<string>();
      const chemistSet = new Set<string>();
      const productSet = new Set<string>();
      const brickSet = new Set<string>();

      let totalPatients = 0;

      data.forEach((camp: any) => {
        const status = camp.status?.toLowerCase();

        // ✅ FINAL PLANNED LOGIC
        if (status !== "rejected" && status !== "pending") planned++;

        if (status === "approved") approved++;
        if (status === "completed") executed++;
        if (status === "pending") pending++;
        if (status === "rejected") rejected++;

        camp.doctors?.forEach((d: any) => doctorSet.add(String(d._id || d)));
        camp.chemists?.forEach((c: any) => chemistSet.add(String(c._id || c)));

        camp.products?.forEach((p: any) =>
          productSet.add(String(p.productId?._id || p.productId)),
        );

        if (camp.brickCode) brickSet.add(camp.brickCode);

        totalPatients += camp.patients?.length || 0;
      });

      return {
        planned,
        executed,
        approved,
        pending,
        rejected,
        totalDoctors: doctorSet.size,
        totalChemists: chemistSet.size,
        totalProducts: productSet.size,
        totalTerritories: brickSet.size,
        totalPatients,
        totalCamps: data.length, // ✅ NEW KEY ADDED
      };
    };
    const currentStats = countStats(camps);
    const prevStats = countStats(prevCamps);

    // -----------------------------
    // PERCENTAGE
    // -----------------------------
    const calcPercent = (curr: number, prev: number) => {
      if (!prev) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    // -----------------------------
    // BAR DATA (🔥 UPDATED)
    // -----------------------------
    const barMap: Record<string, any> = {};

    camps.forEach((camp: any) => {
      const brick = camp.brickCode || "Unknown";
      const status = camp.status?.toLowerCase();

      if (!barMap[brick]) {
        barMap[brick] = {
          brickCode: brick,
          totalCamps: 0,
          approved: 0,
          completed: 0,
          pending: 0,
          rejected: 0,
        };
      }

      barMap[brick].totalCamps += 1;

      if (status === "approved") barMap[brick].approved += 1;
      else if (status === "completed") barMap[brick].completed += 1;
      else if (status === "pending") barMap[brick].pending += 1;
      else if (status === "rejected") barMap[brick].rejected += 1;
    });
    const barData = Object.values(barMap);

    // -----------------------------
    // RESPONSE
    // -----------------------------
    return res.status(200).json({
      success: true,
      data: {
        ...currentStats,
        barData,

        percentage: {
          planned: calcPercent(currentStats.planned, prevStats.planned),
          executed: calcPercent(currentStats.executed, prevStats.executed),
          doctors: calcPercent(
            currentStats.totalDoctors,
            prevStats.totalDoctors,
          ),
          chemists: calcPercent(
            currentStats.totalChemists,
            prevStats.totalChemists,
          ),
          products: calcPercent(
            currentStats.totalProducts,
            prevStats.totalProducts,
          ),
          patients: calcPercent(
            currentStats.totalPatients,
            prevStats.totalPatients,
          ),

          approved: calcPercent(currentStats.approved, prevStats.approved),
          pending: calcPercent(currentStats.pending, prevStats.pending),
          rejected: calcPercent(currentStats.rejected, prevStats.rejected),
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
