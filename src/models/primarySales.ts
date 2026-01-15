import mongoose, { Schema, Document } from "mongoose";

export interface IPrimarySale extends Document {
  orderId: string;
  mrName: string;
  distributorName: string;
  pharmacyId: mongoose.Types.ObjectId;
  address: string;
  medicines: {
    medicineName: string; // store name directly
    quantity: number;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  IStatus?: boolean;
}

const primarySaleSchema = new Schema<IPrimarySale>(
  {
    orderId: { type: String, required: true, unique: true },

    mrName: { type: String, required: true },

    distributorName: { type: String, required: true },

    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
    },

    address: { type: String, required: true },

    medicines: [
      {
        medicineId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],

    subtotal: { type: Number, required: true },

    discount: { type: Number, default: 0 },

    total: { type: Number, required: true },

    IStatus: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const PrimarySale = mongoose.model<IPrimarySale>(
  "PrimarySale",
  primarySaleSchema
);
