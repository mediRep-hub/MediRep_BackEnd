import mongoose, { Document, Schema } from "mongoose";

export interface IMedicine {
  name: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface IOrder extends Document {
  orderId: string;
  mrName: string;
  doctorName: string;
  strategyName: string;
  orderType: string;
  amount: string;
  customerName: string;
  address: string;
  orderDate: Date;
  medicines: IMedicine[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const medicineSchema = new Schema<IMedicine>({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
});

const orderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    mrName: { type: String, required: true },
    doctorName: { type: String, required: true },
    strategyName: { type: String, required: true },
    orderType: { type: String, required: true },
    amount: { type: String, required: true },
    customerName: { type: String, required: true },
    address: { type: String, required: true },
    orderDate: { type: Date, required: true },
    medicines: { type: [medicineSchema], required: true },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>("Order", orderSchema);
