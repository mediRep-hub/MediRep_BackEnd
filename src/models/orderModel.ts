import mongoose, { Document, Schema } from "mongoose";

// Define the IOrder interface with only necessary fields in medicines
export interface IOrder extends Document {
  orderId: string; // Unique order ID
  mrName: string; // Medical representative's name
  pharmacyId: mongoose.Types.ObjectId; // Reference to a Pharmacy
  address: string; // Delivery address
  medicines: { medicineId: mongoose.Types.ObjectId; quantity: number }[]; // Medicines in this order
  subtotal: number; // Price before discount
  discount: number; // Discount applied to the order
  total: number; // Final price after discount
  createdAt?: Date; // Auto-generated field by Mongoose
  updatedAt?: Date; // Auto-generated field by Mongoose
}

// Define the order schema
const orderSchema = new mongoose.Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true }, // Unique Order ID
    mrName: { type: String, required: true }, // Name of the medical representative
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy", // Reference to the Pharmacy model
      required: true,
    },
    address: { type: String, required: true }, // Delivery address
    medicines: [
      {
        medicineId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product", // Referencing the Product model for medicines
          required: true,
        },
        quantity: { type: Number, required: true }, // Quantity of the medicine ordered
      },
    ], // List of medicines in the order
    subtotal: { type: Number, required: true }, // Subtotal amount before discount
    discount: { type: Number, required: true }, // Discount on the order
    total: { type: Number, required: true }, // Total amount after discount
  },
  { timestamps: true } // Automatically create `createdAt` and `updatedAt` fields
);

// Export the Order model
export const Order = mongoose.model<IOrder>("Order", orderSchema);
