import Camp from "../models/campModel";

// ✅ CREATE CAMP
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
    const camps = await Camp.find().populate("chemists").populate({
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

    // 🔥 STRICT FLOW CONTROL (YOUR REQUIREMENT)
    const rules = {
      pending: ["approved", "rejected"], // can go anywhere from pending
      approved: ["completed"], // only completion allowed
      completed: [], // FINAL STATE
      rejected: [], // FINAL STATE
    };

    // ❌ block invalid transitions
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
