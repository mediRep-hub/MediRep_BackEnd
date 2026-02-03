import mongoose, { Schema, Document } from "mongoose";

export interface IBrick extends Document {
  brickName: string;
  city: string;
  mrName: string;
  areas: string[];
  pharmacies: string[];
  doctors: string[];
  products: string[];
}

const BrickSchema: Schema = new Schema(
  {
    brickName: { type: String, required: true, trim: true },
    city: { type: String, required: true },
    mrName: { type: String, required: true },
    areas: { type: [String], default: [] },
    pharmacies: { type: [String], default: [] },
    doctors: { type: [String], default: [] },
    products: { type: [String], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model<IBrick>("Brick", BrickSchema);
