import mongoose from "mongoose";

const callReportSchema = new mongoose.Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
    },
    mrName: {
      type: String,
      required: true,
    },
    doctorName: {
      type: String,
      required: true,
    },

    area: {
      type: String,
      required: true,
    },

    checkIn: {
      type: String,
      required: true,
    },
    checkOut: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const CallReport = mongoose.model("CallReport", callReportSchema);
