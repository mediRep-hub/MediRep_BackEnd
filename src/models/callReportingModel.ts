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
    strategyName: {
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
    doctorResponse: {
      type: String,
      required: true,
    },
    promotionalMaterialGiven: {
      type: String,
      required: true,
    },
    followUpRequired: {
      type: String,
      required: true,
    },
    doctorPurchaseInterest: {
      type: String,
      required: true,
    },
    nextVisitDate: {
      type: Date,
      required: true,
    },
    keyDiscussionPoints: {
      type: String,
      required: true,
    },
    doctorConcerns: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    discustionType: {
      type: String,
      required: true,
    },
    checkInLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

export const CallReport = mongoose.model("CallReport", callReportSchema);
