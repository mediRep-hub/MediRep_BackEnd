import mongoose, { Schema, Document } from "mongoose";

export interface IDoctor extends Document {
  docId: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  startTime: string;
  endTime: string;
  brick: string;
  city: string;
  affiliation: string;
  0;
  image: string;

  location: {
    address: string;
    lat: number;
    lng: number;
  };
}

const DoctorSchema: Schema = new Schema(
  {
    docId: { type: String, unique: false },
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    specialty: { type: String, required: true },
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
  },
  { timestamps: true },
);

export default mongoose.model<IDoctor>("Doctor", DoctorSchema);
