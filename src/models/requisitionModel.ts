import mongoose, { Document, Schema } from "mongoose";

export interface IProduct {
  name: string;
  quantity: number;
  duration: string; // assuming this is like "3 days", "2 weeks" etc.
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
  totalQuantity: number;
  totalDuration: string;
  totalAmount: number;
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

    // 👇 added computed fields
    totalQuantity: { type: Number, default: 0 },
    totalDuration: { type: String, default: "0" },
    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 🧮 Pre-save hook to calculate totals automatically
RequisitionSchema.pre("save", function (next) {
  if (this.product && this.product.length > 0) {
    // total quantity
    this.totalQuantity = this.product.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );

    // total amount
    this.totalAmount = this.product.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );

    // total duration — since duration is string, we’ll concatenate
    this.totalDuration = this.product
      .map((p) => p.duration)
      .filter(Boolean)
      .join(", ");
  } else {
    this.totalQuantity = 0;
    this.totalAmount = 0;
    this.totalDuration = "0";
  }

  next();
});

export default mongoose.model<IRequisition>("Requisition", RequisitionSchema);
