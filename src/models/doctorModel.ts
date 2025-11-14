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
  location: { lat: number; lng: number };
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

    // ⭐ Auto geo-coded lat/lng
    location: {
      lat: Number,
      lng: Number,
    },
  },
  { timestamps: true }
);

// ⭐ Auto-generate docId + auto geocode address
DoctorSchema.pre<IDoctor>("save", async function (next) {
  const apiKey = "AIzaSyBrNjsUsrJ0Mmjhe-WUKDKVaIsMkZ8iQ4A";

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    this.address
  )}&key=${apiKey}`;

  try {
    const response = await axios.get(url);

    if (response.data.status === "OK" && response.data.results.length > 0) {
      const loc = response.data.results[0].geometry.location;
      this.location = { lat: loc.lat, lng: loc.lng };
    }
  } catch (err) {
    console.error("Geocoding error:", err);
  }

  next();
});

export default mongoose.model<IDoctor>("Doctor", DoctorSchema);
