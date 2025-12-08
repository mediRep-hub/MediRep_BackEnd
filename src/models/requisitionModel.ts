import mongoose, { Document, Schema } from "mongoose";

export interface IProduct {
  name: string;
  quantity: number;
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
  accepted: boolean;
  remarks?: string;
  totalQuantity: number;
  duration: string;
  amount?: number;
  requisitionType: "cash" | "other" | "house" | "car" | "tour";
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
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
    attachedDoc: { type: String, required: true },
    details: { type: String, required: true },
    product: { type: [ProductSchema], required: true },
    startingDate: { type: Date, required: true },
    accepted: { type: Boolean, default: false },
    requisitionType: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: function () {
        return this.requisitionType === "Cash";
      },
    },
    remarks: { type: String },
    totalQuantity: { type: Number, default: 0 },
    duration: { type: String, default: "" },
  },
  { timestamps: true }
);

RequisitionSchema.pre("save", function (next) {
  if (this.product && this.product.length > 0) {
    this.totalQuantity = this.product.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
  } else {
    this.totalQuantity = 0;
  }

  next();
});

export default mongoose.model<IRequisition>("Requisition", RequisitionSchema);
