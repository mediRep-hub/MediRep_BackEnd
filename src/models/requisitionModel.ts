import mongoose, { Document, Schema } from "mongoose";

export interface IProduct {
  name: string;
  quantity: number;
  duration: string;
  amount: number;
}

export interface IRequisition extends Document {
  reqId: string;
  mrName: string;
  doctor: mongoose.Types.ObjectId;
  doctorName: string;
  status: string;
  attachedDoc?: string;
  details: string;
  product: IProduct[];
  startingDate: Date;
  paymentType: string;
  accepted: boolean;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  duration: { type: String, required: true },
  amount: { type: Number, required: true },
});

const RequisitionSchema: Schema<IRequisition> = new Schema(
  {
    reqId: {
      type: String,
      required: true,
      unique: true,
      default: () => `REQ-${Date.now()}`,
    },
    mrName: { type: String, required: true },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    doctorName: { type: String, required: true },
    status: { type: String, default: "Pending" },
    attachedDoc: { type: String },
    details: { type: String, required: true },
    product: { type: [ProductSchema], required: true },
    startingDate: { type: Date, required: true },
    paymentType: { type: String, required: true },
    accepted: { type: Boolean, default: false },
    remarks: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IRequisition>("Requisition", RequisitionSchema);
