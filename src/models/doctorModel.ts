import mongoose, { Schema, Document } from "mongoose";

export interface IDoctor extends Document {
  docId: string; // 👈 add this
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
  },
  { timestamps: true }
);

// ✅ Pre-save middleware to generate unique docId
DoctorSchema.pre("save", async function (next) {
  if (!this.docId) {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    this.docId = `DOC${randomNum}`;
  }
  next();
});

export default mongoose.model<IDoctor>("Doctor", DoctorSchema);
