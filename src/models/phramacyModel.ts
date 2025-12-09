import mongoose, { Schema, Document } from "mongoose";

export interface IPharmacy extends Document {
  pharmacyId: string;
  name: string;
  email: string;
  phone: string;
  startTime: string;
  endTime: string;
  region: string;
  area: string;
  affiliation: string;
  image: string;

  location: {
    address: string;
    lat: number;
    lng: number;
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
    region: { type: String, required: true },
    area: { type: String, required: true },
    affiliation: { type: String, required: true },
    image: { type: String, required: true },
    location: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPharmacy>("Pharmacy", PharmacySchema);
