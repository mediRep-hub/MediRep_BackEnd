import mongoose, { Schema, Document } from "mongoose";

export interface IBrick extends Document {
  brickId: string;
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
    brickId: { type: String, unique: true }, // <-- auto-generated ID
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

// Pre-save hook to generate unique brickId
BrickSchema.pre<IBrick>("save", async function (next) {
  if (!this.brickId) {
    let unique = false;
    while (!unique) {
      const randomNumber = Math.floor(100 + Math.random() * 900); // 3-digit
      const id = `BRI${randomNumber}`;
      const exists = await mongoose.models.Brick.findOne({ brickId: id });
      if (!exists) {
        this.brickId = id;
        unique = true;
      }
    }
  }
  next();
});

export default mongoose.model<IBrick>("Brick", BrickSchema);
