import mongoose from "mongoose";
import { nanoid } from "nanoid"; // for unique callId

const callReportingSchema = new mongoose.Schema(
  {
    // Strategy-related fields
    region: { type: String },
    area: { type: String },
    strategyName: { type: String },
    route: { type: String },
    day: { type: String },
    mrName: { type: String },
    doctorList: [{ type: mongoose.Schema.Types.ObjectId, ref: "Doctor" }],
    activeRequisition: { type: String },

    // Call report-related fields
    callId: { type: String, unique: true, default: () => nanoid(10) }, // auto-generated
    doctorName: { type: String },
    doctorAddress: { type: String },
    checkIn: { type: String },
    checkOut: { type: String },
    duration: { type: String },
    productDiscussed: { type: String },
    doctorResponse: { type: String },
    promotionalMaterialGiven: { type: String },
    followUpRequired: { type: String },
    doctorPurchaseInterest: { type: String },
    nextVisitDate: { type: Date },
    keyDiscussionPoints: { type: String },
    doctorConcerns: { type: String },
    discussionType: { type: String },
    checkInLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },

    // Extra fields
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    doctorAvailability: { type: String },
    reason: { type: String },
  },
  { timestamps: true }
);

const CallReporting = mongoose.model("CallReporting", callReportingSchema);

export default CallReporting;
