import mongoose, { Schema, Document } from "mongoose";

export interface IPharmacy extends Document {
  pharmacyId: string;
  name: string;
  email: string;
  phone: string;
  startTime: string;
  endTime: string;
  brick: string;
  city: string;
  affiliation: string;
  image: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  discount?: {
    duration: number; // or string if you prefer
    value: number;
    endDate: Date;
  };
}

const PharmacySchema: Schema = new Schema(
  {
    pharmacyId: { type: String, unique: false },
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    brick: { type: String, required: true },
    city: { type: String, required: true },
    affiliation: { type: String, required: true },
    image: { type: String, required: true },
    location: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    discount: {
      duration: { type: Number, required: false },
      value: { type: Number, required: false },
      endDate: { type: Date, required: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPharmacy>("Pharmacy", PharmacySchema);
