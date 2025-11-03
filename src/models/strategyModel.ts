import mongoose, { Schema, Document } from "mongoose";

export interface IStrategy extends Document {
  region: string;
  area: string;
  strategyName: string;
  route: string;
  day: string;
  mrName: string;
  doctorList: string[]; // array of doctor names or IDs
}

const StrategySchema: Schema = new Schema(
  {
    region: { type: String, required: true },
    area: { type: String, required: true },
    strategyName: { type: String, required: true },
    route: { type: String, required: true },
    day: { type: String, required: true },
    mrName: { type: String, required: true },
    doctorList: [{ type: String, required: true }], // or [{ type: Schema.Types.ObjectId, ref: "Doctor" }]
  },
  { timestamps: true }
);

export default mongoose.model<IStrategy>("Strategy", StrategySchema);
