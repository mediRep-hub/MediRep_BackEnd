// models/CallReporting.ts
import mongoose, { Document, Types, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

// --- Subdocument interface ---
export interface IDoctorSubDoc extends Document {
  doctor: Types.ObjectId;
  callId: string;
  status: "pending" | "close" | "rejected";
  activeRequisition: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  productDiscussed: string;
  doctorResponse: string;
  promotionalMaterialGiven: string;
  followUpRequired: string;
  doctorPurchaseInterest: string;
  nextVisitDate: Date | null;
  keyDiscussionPoints: string;
  doctorConcerns: string;
  discussionType: string;
  checkInLocation: { lat: number; lng: number };
  doctorAvailability: string;
  reason: string;
}
export interface IDoctorSubDoc extends Document {
  doctor: Types.ObjectId;
  callId: string;
  status: "pending" | "close" | "rejected";
  activeRequisition: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  productDiscussed: string;
  doctorResponse: string;
  promotionalMaterialGiven: string;
  followUpRequired: string;
  doctorPurchaseInterest: string;
  nextVisitDate: Date | null;
  keyDiscussionPoints: string;
  doctorConcerns: string;
  discussionType: string;
  checkInLocation: { lat: number; lng: number };
  doctorAvailability: string;
  reason: string;
}

// --- Doctor Subschema ---
const doctorSubSchema = new Schema<IDoctorSubDoc>(
  {
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    callId: {
      type: String,
      default: () => `CALL-${uuidv4()}`,
      required: true, // Add required constraint
    },
    status: {
      type: String,
      enum: ["pending", "close", "rejected"],
      default: "pending",
    },
    activeRequisition: { type: String, default: "" },
    checkIn: { type: String, default: "" },
    checkOut: { type: String, default: "" },
    duration: { type: String, default: "" },
    productDiscussed: { type: String, default: "" },
    doctorResponse: { type: String, default: "" },
    promotionalMaterialGiven: { type: String, default: "" },
    followUpRequired: { type: String, default: "" },
    doctorPurchaseInterest: { type: String, default: "" },
    nextVisitDate: { type: Date, default: null },
    keyDiscussionPoints: { type: String, default: "" },
    doctorConcerns: { type: String, default: "" },
    discussionType: { type: String, default: "" },
    checkInLocation: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    doctorAvailability: { type: String, default: "" },
    reason: { type: String, default: "" },
  },
  { _id: true }
);

// --- Main Call Reporting Schema ---
export interface ICallReporting extends Document {
  region: string;
  area: string;
  strategyName: string;
  route: string;
  day: string;
  mrName: Types.ObjectId;
  doctorList: Types.DocumentArray<IDoctorSubDoc>;
  createdAt: Date;
  updatedAt: Date;
}

const callReportingSchema = new Schema<ICallReporting>(
  {
    region: { type: String },
    area: { type: String },
    strategyName: { type: String },
    route: { type: String },
    day: { type: String },
    mrName: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    doctorList: [doctorSubSchema],
  },
  { timestamps: true }
);

// Update the static method to ensure callId is always set
callReportingSchema.statics.prepareDoctorList = function (doctorIds: string[]) {
  return doctorIds.map((id) => ({
    doctor: new Types.ObjectId(id),
    callId: `CALL-${uuidv4()}`,
    status: "pending",
    activeRequisition: "",
    checkIn: "",
    checkOut: "",
    duration: "",
    productDiscussed: "",
    doctorResponse: "",
    promotionalMaterialGiven: "",
    followUpRequired: "",
    doctorPurchaseInterest: "",
    nextVisitDate: null,
    keyDiscussionPoints: "",
    doctorConcerns: "",
    discussionType: "",
    checkInLocation: { lat: 0, lng: 0 },
    doctorAvailability: "",
    reason: "",
  }));
};

const CallReporting = mongoose.model<ICallReporting>(
  "CallReporting",
  callReportingSchema
);

export default CallReporting;
