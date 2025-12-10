import mongoose, { Document, Schema } from "mongoose";

export interface IOrder extends Document {
  orderId: string;
  mrName: string;
  pharmacyId: mongoose.Types.ObjectId;
  address: string;
  medicines: { medicineId: mongoose.Types.ObjectId; quantity: number }[];
  subtotal: number;
  discount: number;
  total: number;
  distributorName: string;
  IStatus?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const orderSchema = new mongoose.Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    mrName: { type: String, required: true },
    distributorName: { type: String, required: true },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
    },
    address: { type: String, required: true },
    medicines: [
      {
        medicineId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number },
    total: { type: Number, required: true },

    // 👇 Add this new field
    IStatus: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>("Order", orderSchema);
