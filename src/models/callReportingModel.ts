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
    doctorAddress: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
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
    duration: {
      type: String,
      required: true,
    },
    productDiscussed: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    nextVisitDate: {
      type: Date,
    },
    checkInLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

export const CallReport = mongoose.model("CallReport", callReportSchema);
