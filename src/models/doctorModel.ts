import mongoose, { Schema, Document } from "mongoose";
import axios from "axios";

export interface IDoctor extends Document {
  docId: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  address: string;
  startTime: string;
  endTime: string;
  region: string;
  area: string;
  affiliation: string;
  image: string;
  location: {
    lat: number;
    lng: number;
  };
}

const DoctorSchema: Schema = new Schema(
  {
    docId: { type: String, unique: false },

    name: { type: String, required: true },
    specialty: { type: String, required: true },
    email: { type: String, required: true, unique: false },
    phone: { type: String, required: true },
    address: { type: String, required: true },

    startTime: { type: String, required: true },
    endTime: { type: String, required: true },

    region: { type: String, required: true },
    area: { type: String, required: true },

    affiliation: { type: String, required: true },
    image: { type: String, required: true },

    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IDoctor>("Doctor", DoctorSchema);
