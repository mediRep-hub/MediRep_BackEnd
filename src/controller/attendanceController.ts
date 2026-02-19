import { Request, Response } from "express";
import Attendance, { IAttendance } from "../models/attendanceModel";
import Account from "../models/admin";
import JWTService from "../services/JWTService";
import User from "../models/admin";
import moment from "moment-timezone";
import Leave from "../models/leavesModel";
import CompanyTiming from "../models/companyTimingModel";

const isLateCheckIn = (checkInDate: Date, startTime: string) => {
  const [hours, minutes] = startTime.split(":").map(Number);

  const companyStart = new Date(checkInDate);
  companyStart.setHours(hours, minutes, 0, 0);

  return checkInDate > companyStart;
};
// Function to create daily attendance records with status "Absent"
export const createDailyAttendance = async (req: Request, res: Response) => {
  try {
    const todayInUTC = moment.utc().startOf("day").toDate();

    // ✅ Check if attendance already exists for today
    const existingToday = await Attendance.findOne({ date: todayInUTC });
    if (existingToday) {
      return res.status(400).json({
        message: "Daily attendance has already been created for today.",
      });
    }

    const employees = await User.find(); // Get all employees

    for (const employee of employees) {
      // 1️⃣ Check if employee has leave today
      const onLeave = await Leave.findOne({
        adminId: employee.adminId,
        status: "Approved", // Only consider approved leaves
        startDate: { $lte: todayInUTC },
        endDate: { $gte: todayInUTC },
      });

      if (onLeave) {
        console.log(
          `Skipping attendance for ${employee.name}, on leave today.`,
        );
        continue;
      }

      // 2️⃣ Create attendance as "Absent"
      const newAttendance = new Attendance({
        employee: {
          _id: employee._id,
          employeeId: employee.adminId || employee._id.toString(),
          employeeName: employee.name,
          employeeRole: employee.position || "Employee",
          employeeType: employee.division || "Employee",
        },
        date: todayInUTC,
        status: "Absent",
        checkInStatus: "Pending",
      });

      await newAttendance.save();
      console.log(`Attendance created for ${employee.name}`);
    }

    res.json({
      message: "Attendance records successfully created for today.",
    });
  } catch (error) {
    console.error("Error creating daily attendance records:", error);
    res
      .status(500)
      .json({ message: "Error creating attendance records", error });
  }
};

export const checkIn = async (req: Request, res: Response) => {
  try {
    /* -------------------------------- Token -------------------------------- */
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res
        .status(401)
        .json({ message: "Authorization token is missing" });

    const decodedToken = JWTService.verifyAccessToken(token);
    const loggedInUserId = decodedToken._id;

    /* ----------------------------- Logged-in User ---------------------------- */
    const loggedInUser = await User.findById(loggedInUserId);
    if (!loggedInUser)
      return res.status(404).json({ message: "User not found" });

    const isAdmin = loggedInUser.position === "admin";

    /* ----------------------------- Employee ID ------------------------------- */
    const adminId = isAdmin ? req.body.adminId : loggedInUser.adminId;
    if (!adminId)
      return res.status(400).json({ message: "Employee ID is required" });

    /* ------------------------------- Company Timing -------------------------- */
    const companyTiming = await CompanyTiming.findOne();
    if (!companyTiming || !companyTiming.startTime)
      return res
        .status(400)
        .json({ message: "Company start time not configured" });

    const lateAfterMinutes = companyTiming.lateAfterMinutes || 0; // grace period

    /* -------------------------------- Date ---------------------------------- */
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    /* ------------------------------- Attendance ------------------------------ */
    let attendance = await Attendance.findOne({
      "employee.adminId": adminId,
      date: today,
    });

    if (attendance?.checkInStatus === "CheckedIn") {
      return res.status(400).json({ message: "Already checked in today" });
    }

    /* ----------------------------- Create if not exists ---------------------- */
    if (!attendance) {
      attendance = new Attendance({
        employee: {
          _id: loggedInUser._id,
          adminId: loggedInUser.adminId,
          employeeName: loggedInUser.name,
          employeeRole: loggedInUser.position,
        },
        date: today,
        status: "Absent",
        checkInStatus: "CheckedOut",
      });
    }

    /* ------------------------------- Check-in Logic -------------------------- */
    const checkInTime = new Date();
    const { location } = req.body;

    // Convert company start time to Date object
    const [hours, minutes] = companyTiming.startTime.split(":").map(Number);
    const companyStartDate = new Date(today);
    companyStartDate.setHours(hours, minutes, 0, 0);

    // Add lateAfterMinutes to company start time
    const lateThreshold = new Date(
      companyStartDate.getTime() + lateAfterMinutes * 60000,
    );

    // Determine Late or Present
    const isLate = checkInTime > lateThreshold;

    attendance.checkInStatus = "CheckedIn";
    attendance.status = isLate ? "Late" : "Present";

    attendance.checkIn = {
      time: checkInTime,
      location,
    };

    await attendance.save();

    /* -------------------------------- Response ------------------------------- */
    return res.status(200).json({
      message: isLate
        ? "Checked in successfully (Late)"
        : "Checked in successfully",
      attendance,
    });
  } catch (error) {
    console.error("Check-in Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error,
    });
  }
};

export const checkOut = async (req: Request, res: Response) => {
  try {
    const { adminId, location } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set the time to 00:00:00 for today

    // Find the attendance record for today
    const attendance = await Attendance.findOne({
      "employee.adminId": adminId,
      date: today,
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: "Check-in required first" });
    }

    // Ensure the user is checked in and not already checked out
    if (attendance.checkInStatus === "CheckedOut") {
      return res.status(400).json({ message: "Already checked out today" });
    }

    // Ensure the user is not on break
    if (attendance.checkInStatus === "OnBreak") {
      return res
        .status(400)
        .json({ message: "Cannot check out while on break" });
    }

    // Log the check-out time and location
    attendance.checkOut = { time: new Date(), location };

    // Update the check-in status to "CheckedOut"
    attendance.checkInStatus = "CheckedOut";

    // Save the updated attendance record
    await attendance.save();

    res.json({ message: "Checked out successfully", attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Start Break
export const startBreak = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.body; // Get the logged-in user's adminId
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Get today's date (ignoring time)

    const attendance = await Attendance.findOne({
      "employee.adminId": adminId,
      date: today,
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: "Check-in required first" });
    }

    // Ensure the user is currently checked in (not on break or checked out)
    if (attendance.checkInStatus === "OnBreak") {
      return res.status(400).json({ message: "Already on break" });
    }

    if (attendance.checkInStatus === "CheckedOut") {
      return res
        .status(400)
        .json({ message: "Cannot start a break after checking out" });
    }

    // Check if break is already started
    if (attendance.break && attendance.break.startTime) {
      return res.status(400).json({ message: "Break already started" });
    }

    // Start the break
    attendance.break = { startTime: new Date() };
    attendance.checkInStatus = "OnBreak"; // Set checkInStatus to OnBreak
    await attendance.save();

    res.json({ message: "Break started", attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// End Break

export const endBreak = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.body; // Get the logged-in user's adminId
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Get today's date (ignoring time)

    // Find the attendance record for today
    const attendance = await Attendance.findOne({
      "employee.adminId": adminId,
      date: today,
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: "Check-in required first" });
    }

    // Ensure the user is currently on break before ending the break
    if (attendance.checkInStatus !== "OnBreak") {
      return res
        .status(400)
        .json({ message: "You are not currently on break" });
    }

    // Check if break was started
    if (!attendance.break || !attendance.break.startTime) {
      return res.status(400).json({ message: "Break not started yet" });
    }

    // End the break by setting the end time
    attendance.break.endTime = new Date();
    attendance.checkInStatus = "CheckedIn"; // Set checkInStatus back to CheckedIn
    await attendance.save();

    res.json({ message: "Break ended", attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all attendance logs (HR/Admin)
export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    const { search, month, year } = req.query;

    const query: any = {};

    // Search filter
    if (search) {
      query.$or = [
        { "employee.adminId": { $regex: search, $options: "i" } },
        { "employee.employeeName": { $regex: search, $options: "i" } },
      ];
    }

    // Month and Year filter
    if (month && year) {
      // Month in JS is 0-indexed
      const startDate = moment
        .utc(`${year}-${month}-01`)
        .startOf("day")
        .toDate();
      const endDate = moment.utc(startDate).endOf("month").toDate();

      query.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const logs = await Attendance.find(query).sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const editAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body; // e.g., status, checkIn, checkOut, reason

    const attendance = await Attendance.findById(id);
    if (!attendance)
      return res.status(404).json({ message: "Attendance not found" });
    if (attendance.locked)
      return res.status(400).json({ message: "Cannot edit locked attendance" });

    Object.assign(attendance, updates);
    await attendance.save();

    res.json({ message: "Attendance updated successfully", attendance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get attendance summary (HR/Admin)
export const getAttendanceSummary = async (req: Request, res: Response) => {
  try {
    // ─── TODAY RANGE ─────────────────────────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // ─── YESTERDAY RANGE ─────────────────────────────────────
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);

    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(todayEnd.getDate() - 1);

    // ─── USER STATS ──────────────────────────────────────────
    const totalEmployees = await Account.countDocuments();
    const totalNewUsers = await Account.countDocuments({
      createdAt: { $gte: todayStart },
    });

    // ─── ATTENDANCE COUNTER (FIXED) ──────────────────────────
    const getAttendanceCounts = async (
      start: Date,
      end: Date,
    ): Promise<Record<string, number>> => {
      const summary = await Attendance.aggregate([
        {
          $match: {
            date: {
              $gte: start,
              $lte: end,
            },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const counts: Record<string, number> = {
        Present: 0,
        Absent: 0,
        Late: 0,
        "On Leave": 0,
      };

      summary.forEach((item) => {
        counts[item._id] = item.count;
      });

      return counts;
    };

    const todayCounts = await getAttendanceCounts(todayStart, todayEnd);
    const yesterdayCounts = await getAttendanceCounts(
      yesterdayStart,
      yesterdayEnd,
    );

    // ─── PERCENTAGE CALC ─────────────────────────────────────
    const calcChange = (today: number, yesterday: number) => {
      if (yesterday === 0) return today === 0 ? 0 : 100;
      return Math.round(((today - yesterday) / yesterday) * 100);
    };

    // ─── RESPONSE ────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        totalNewUsers,

        present: todayCounts.Present,
        presentChange: calcChange(todayCounts.Present, yesterdayCounts.Present),

        absent: todayCounts.Absent,
        absentChange: calcChange(todayCounts.Absent, yesterdayCounts.Absent),

        late: todayCounts.Late,
        lateChange: calcChange(todayCounts.Late, yesterdayCounts.Late),

        leave: todayCounts["On Leave"],
        leaveChange: calcChange(
          todayCounts["On Leave"],
          yesterdayCounts["On Leave"],
        ),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance summary",
      error: error.message,
    });
  }
};

export const getUserAttendanceStatus = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(400)
        .json({ message: "Authorization token is missing" });
    }

    const decodedToken = JWTService.verifyAccessToken(token);
    const adminId = decodedToken._id;

    if (!adminId) {
      return res.status(400).json({ message: "User not authenticated" });
    }

    const todayStart = moment.utc().startOf("day").toDate();

    const tomorrowStart = moment.utc().add(1, "day").startOf("day").toDate();

    console.log("🚀 ~ getUserAttendanceStatus ~ todayStart:", todayStart);
    console.log("🚀 ~ getUserAttendanceStatus ~ tomorrowStart:", tomorrowStart);

    const attendance = await Attendance.findOne({
      "employee._id": adminId,
      date: { $gte: todayStart, $lt: tomorrowStart },
    });

    if (!attendance) {
      return res
        .status(404)
        .json({ message: "No attendance record found for today" });
    }

    const {
      status,
      checkInStatus,
      checkIn,
      checkOut,
      break: breakDetails,
    } = attendance;

    const checkInTime = checkIn ? checkIn.time : null;
    const checkOutTime = checkOut ? checkOut.time : null;

    const breakStatus = breakDetails
      ? {
          startTime: breakDetails.startTime,
          endTime: breakDetails.endTime,
        }
      : null;

    const response = {
      status,
      checkInStatus,
      checkInTime,
      checkOutTime,
      breakStatus,
      message: "Attendance data fetched successfully",
    };

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const updateAttendanceAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id);
    if (!attendance)
      return res.status(404).json({ message: "Attendance not found" });

    if (attendance.locked)
      return res
        .status(400)
        .json({ message: "This attendance is locked and cannot be edited" });

    /* ---------- Company Timing ---------- */
    const companyTiming = await CompanyTiming.findOne();
    if (!companyTiming?.startTime) {
      return res
        .status(400)
        .json({ message: "Company start time not configured" });
    }

    const DEFAULT_LOCATION = {
      lat: 31.441949367930203,
      lng: 74.26074501840554,
      address: "BerryBoost – IT Company in Lahore",
    };

    let updated = false;

    const checkInTime = req.body.checkInTime || req.body?.checkIn?.time;
    const checkOutTime = req.body.checkOutTime || req.body?.checkOut?.time;

    /* ================= CHECK-IN ================= */
    if (checkInTime) {
      const checkInDate = new Date(checkInTime);
      if (isNaN(checkInDate.getTime()))
        return res.status(400).json({ message: "Invalid check-in time" });

      attendance.checkIn = {
        time: checkInDate,
        location: DEFAULT_LOCATION,
      };

      // Convert company start time to Date (assuming it's stored as "HH:mm")
      const today = new Date();
      const [hours, minutes] = companyTiming.startTime.split(":").map(Number);
      const companyStartDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        hours,
        minutes,
      );

      // Add lateAfterMinutes to company start time
      const lateAfterMinutes = companyTiming.lateAfterMinutes || 0; // default 0 if not set
      const lateThreshold = new Date(
        companyStartDate.getTime() + lateAfterMinutes * 60000,
      ); // 60000ms = 1 min

      // Determine Present or Late
      if (checkInDate > lateThreshold) {
        attendance.status = "Late";
      } else {
        attendance.status = "Present";
      }

      attendance.checkInStatus = "CheckedIn";
      updated = true;
    }

    /* ================= CHECK-OUT ================= */
    if (checkOutTime) {
      const date = new Date(checkOutTime);
      if (isNaN(date.getTime()))
        return res.status(400).json({ message: "Invalid check-out time" });

      if (!attendance.checkIn)
        return res
          .status(400)
          .json({ message: "Cannot check out without check-in" });

      attendance.checkOut = {
        time: date,
        location: DEFAULT_LOCATION,
      };

      attendance.checkInStatus = "CheckedOut";
      updated = true;
    }

    if (!updated)
      return res.status(400).json({ message: "No valid fields to update" });

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      attendance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update attendance",
      error,
    });
  }
};

export const getMonthlyAttendanceGraph = async (
  req: Request,
  res: Response,
) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    // 1️⃣ Total employees (constant for all months)
    const totalEmployees = await User.countDocuments();

    // 2️⃣ Aggregate present attendance month-wise
    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          status: "Present",
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$date" },
          presentCount: { $sum: 1 },
        },
      },
    ]);

    // 3️⃣ Month mapping
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // 4️⃣ Format response for chart
    const graphData = monthNames.map((month, index) => {
      const found = attendanceData.find((item) => item._id === index + 1);

      return {
        month,
        Total: totalEmployees,
        Present: found ? found.presentCount : 0,
      };
    });

    res.status(200).json({
      success: true,
      data: graphData,
    });
  } catch (error) {
    console.error("Monthly attendance graph error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance graph",
      error,
    });
  }
};

export const getCompanyTiming = async (req: Request, res: Response) => {
  try {
    const timing = await CompanyTiming.findOne();
    if (!timing) {
      return res.status(404).json({
        success: false,
        message: "No company timing set yet",
      });
    }

    res.json({
      success: true,
      timing,
    });
  } catch (error) {
    console.error("Error fetching company timing:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error,
    });
  }
};

export const setCompanyTiming = async (req: Request, res: Response) => {
  try {
    const { startTime, endTime, lateAfterMinutes = 0 } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Start time and end time are required",
      });
    }

    // Find existing timing
    let timing = await CompanyTiming.findOne();

    if (!timing) {
      // ✅ Create new timing if none exists
      timing = await CompanyTiming.create({
        startTime,
        endTime,
        lateAfterMinutes,
      });
    } else {
      // ✅ Update existing timing
      timing.startTime = startTime;
      timing.endTime = endTime;
      timing.lateAfterMinutes = lateAfterMinutes;
      await timing.save();
    }

    res.json({
      success: true,
      message: "Company timing set successfully",
      timing,
    });
  } catch (error) {
    console.error("Error setting company timing:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};
