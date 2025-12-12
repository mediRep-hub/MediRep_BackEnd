import mongoose, { Document, Model, Types, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const generateShortId = () => {
  return `CALL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

// ---------------- SUB DOCUMENT ----------------

export interface IDoctorSubDoc extends Document {
  doctor: Types.ObjectId;
  callId: string;
  status: "pending" | "close" | "check In";
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

// ---------------- MAIN DOCUMENT ----------------

export interface IBrick extends Document {
  region?: string;
  area?: string;
  brickName?: string;
  route?: string;
  day?: string;
  mrName: Types.ObjectId;
  doctorList: Types.DocumentArray<IDoctorSubDoc>;
  products: string[]; // array of strings
  createdAt: Date;
  updatedAt: Date;
}

export interface IBrickModel extends Model<IBrick> {
  prepareDoctorList(doctorIds: string[]): IDoctorSubDoc[];
}

// ---------------- SUB SCHEMA ----------------

const doctorSubSchema = new Schema<IDoctorSubDoc>({
  doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
  callId: { type: String, default: generateShortId, required: true },
  status: {
    type: String,
    enum: ["pending", "close", "check In"],
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

// ---------------- MAIN SCHEMA (Brick) ----------------

const brickSchema = new Schema<IBrick>(
  {
    region: { type: String },
    area: { type: String },
    brickName: { type: String },
    route: { type: String },
    day: { type: String },
    mrName: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    doctorList: [doctorSubSchema],
    products: [{ type: String, required: true }], // ✅ array of strings
  },
  { timestamps: true }
);

// ---------------- STATIC METHOD ----------------

brickSchema.statics.prepareDoctorList = function (doctorIds: string[]) {
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

// ---------------- MODEL ----------------

const Brick = mongoose.model<IBrick, IBrickModel>("Brick", brickSchema);

export default Brick;

// export const validateCheckLocation = (data: any) => {
//   const schema = Joi.object({
//     callReportId: Joi.string().pattern(objectIdRegex).required().messages({
//       "any.required": "Call Report ID is required",
//       "string.pattern.base": "Invalid Call Report ID",
//     }),
//     doctorId: Joi.string().pattern(objectIdRegex).required().messages({
//       "any.required": "Doctor ID is required",
//       "string.pattern.base": "Invalid Doctor ID",
//     }),
//     lat: Joi.number().required().messages({
//       "any.required": "Latitude is required",
//       "number.base": "Latitude must be a number",
//     }),
//     lng: Joi.number().required().messages({
//       "any.required": "Longitude is required",
//       "number.base": "Longitude must be a number",
//     }),
//   });

//   return schema.validate(data, { abortEarly: false });
// };
