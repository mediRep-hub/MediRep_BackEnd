import mongoose, { Document, Model, Types, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

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

// --- Model interface including static method ---
export interface ICallReportingModel extends Model<ICallReporting> {
  prepareDoctorList(doctorIds: string[]): IDoctorSubDoc[];
}

// Doctor sub-schema
const doctorSubSchema = new Schema<IDoctorSubDoc>({
  doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
  callId: { type: String, default: () => `CALL-${uuidv4()}`, required: true },
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
});

// Main schema
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

// --- Static method ---
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

// --- Create model ---
const CallReporting = mongoose.model<ICallReporting, ICallReportingModel>(
  "CallReporting",
  callReportingSchema
);

export default CallReporting;
