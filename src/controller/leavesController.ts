import { Request, Response } from "express";
import Leave, { ILeave } from "../models/leavesModel";
import moment from "moment";
import Attendance from "../models/attendanceModel";
import { sendNotification } from "../utils/notifications";
import Admin from "../models/admin";

export const applyLeave = async (req: Request, res: Response) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ message: "Reason is required" });
    }

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const employee = await Admin.findOne({ adminId: employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const leaveEntitlements = employee.leaveEntitlements;

    const leaveTypeMap: Record<string, string> = {
      "Casual Leave": "casualLeave",
      "Sick Leave": "sickLeave",
      "Earned Leave": "earnedLeave",
      "Maternity Leave": "maternityLeave",
      "Unpaid Leave": "unpaidLeave",
      "Annual Leave": "annualLeave",
      "Paternity Leave": "paternityLeave",
      "Compensatory Leave": "compensatoryLeave",
    };

    const leaveKey = leaveTypeMap[leaveType];
    if (!leaveKey || !leaveEntitlements[leaveKey]) {
      return res
        .status(400)
        .json({ message: `Invalid leave type: ${leaveType}` });
    }

    const start = moment(startDate).startOf("day");
    const end = moment(endDate).startOf("day");
    const requestedDays = end.diff(start, "days") + 1;

    if (requestedDays <= 0)
      return res
        .status(400)
        .json({ message: "End date must be after start date" });

    const availableLeave =
      leaveEntitlements[leaveKey].total - leaveEntitlements[leaveKey].consumed;

    if (requestedDays > availableLeave) {
      return res.status(400).json({
        message: `Not enough ${leaveType}. Available: ${availableLeave}, requested: ${requestedDays}`,
      });
    }

    // Check overlapping leaves
    const overlapping = await Leave.findOne({
      employeeId,
      status: "Approved",
      $or: [
        { startDate: { $lte: endDate, $gte: startDate } },
        { endDate: { $lte: endDate, $gte: startDate } },
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
      ],
    });

    if (overlapping)
      return res
        .status(400)
        .json({ message: "Leave overlaps with existing approved leave" });

    const leave = await Leave.create({
      adminId: employee.adminId,
      employeeId: employee._id, // 👈 add this
      employeeName: employee.name,
      leaveType,
      startDate,
      endDate,
      reason,
      status: "Pending",
    });

    try {
      const admins = await Admin.find({
        role: "admin",
        fcmToken: { $exists: true, $ne: "" },
      });

      const adminTokens: string[] = admins
        .map((admin) => admin.fcmToken)
        .filter(Boolean);

      if (adminTokens.length > 0) {
        await sendNotification(
          adminTokens,
          "Leave Applied",
          `${employee.name} applied for ${leaveType}.`,
        );
        console.log("✅ Leave notification sent to admins successfully");
      } else {
        console.log("⚠️ No admin FCM tokens found");
      }
    } catch (notifError) {
      console.error("Failed to send leave notification:", notifError);
    }

    res.status(201).json({ message: "Leave applied successfully", leave });
  } catch (error) {
    console.error("Apply Leave Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

interface ILeaveType {
  total: number;
  consumed: number;
}

interface ILeaveEntitlements {
  casualLeave: ILeaveType;
  sickLeave: ILeaveType;
  annualLeave: ILeaveType;
  maternityLeave: ILeaveType;
  paternityLeave: ILeaveType;
}

export const updateLeaveStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, approvedBy } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // 1️⃣ Find Leave
    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    const previousStatus = leave.status;

    // 2️⃣ Update Leave Status
    leave.status = status;
    leave.approvedBy = approvedBy || null;
    await leave.save();

    // 3️⃣ Only execute when approving leave first time
    if (previousStatus !== "Approved" && status === "Approved") {
      const employee = await Admin.findById(leave.employeeId);

      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // 4️⃣ Map leave type
      const leaveKeyMap: Record<string, string> = {
        "Casual Leave": "casualLeave",
        "Sick Leave": "sickLeave",
        "Annual Leave": "annualLeave",
        "Maternity Leave": "maternityLeave",
        "Paternity Leave": "paternityLeave",
      };

      const leaveKey = leaveKeyMap[leave.leaveType];

      if (!leaveKey) {
        return res.status(400).json({ message: "Invalid leave type" });
      }

      // 5️⃣ Calculate total leave days
      const startDate = moment(leave.startDate).startOf("day");
      const endDate = moment(leave.endDate).startOf("day");

      const totalDays = endDate.diff(startDate, "days") + 1;

      if (totalDays <= 0) {
        return res.status(400).json({ message: "Invalid leave dates" });
      }

      // 6️⃣ Increment leave consumed (NO full validation)
      await Admin.findByIdAndUpdate(
        employee._id,
        {
          $inc: {
            [`leaveEntitlements.${leaveKey}.consumed`]: totalDays,
          },
        },
        { runValidators: false },
      );

      // 7️⃣ Update Attendance (NO new record creation)
      for (let i = 0; i < totalDays; i++) {
        const dayStart = moment(startDate)
          .add(i, "days")
          .startOf("day")
          .toDate();

        const dayEnd = moment(dayStart).endOf("day").toDate();

        await Attendance.findOneAndUpdate(
          {
            "employee.employeeId": employee.adminId,
            date: { $gte: dayStart, $lte: dayEnd },
          },
          {
            $set: {
              status: "On Leave",
              checkInStatus: "On Leave",
              leaveInfo: {
                leaveId: leave._id,
                leaveType: leave.leaveType,
              },
            },
          },
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: `Leave ${status} successfully`,
      leave,
    });
  } catch (error: any) {
    console.error("Update Leave Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
// Get all leaves (HR/Admin)
export const getAllLeaves = async (req: Request, res: Response) => {
  try {
    const { search } = req.query; // e.g., /leaves?search=Bilal

    const query: any = {};

    if (search) {
      query.$or = [
        { adminId: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const leaves = await Leave.find(query).sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get leave history of an employee
export const getEmployeeLeaves = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    const leaves = await Leave.find({ adminId }).sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Update leave (Edit leave request)
export const updateLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { leaveType, startDate, endDate, reason } = req.body;

    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    // Prevent update if already approved
    if (leave.status === "Approved") {
      return res
        .status(400)
        .json({ message: "Approved leave cannot be edited" });
    }

    // Check overlapping again (exclude current leave)
    const overlapping = await Leave.findOne({
      adminId: leave.employeeId,
      status: "Approved",
      _id: { $ne: id },
      $or: [
        { startDate: { $lte: endDate, $gte: startDate } },
        { endDate: { $lte: endDate, $gte: startDate } },
      ],
    });

    if (overlapping) {
      return res
        .status(400)
        .json({ message: "Leave overlaps with existing approved leave" });
    }

    leave.leaveType = leaveType;
    leave.startDate = startDate;
    leave.endDate = endDate;
    leave.reason = reason;

    await leave.save();

    res.json({ message: "Leave updated successfully", leave });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
// Delete leave
export const deleteLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    if (leave.status === "Approved") {
      return res
        .status(400)
        .json({ message: "Approved leave cannot be deleted" });
    }

    await Leave.findByIdAndDelete(id);

    res.json({ message: "Leave deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
