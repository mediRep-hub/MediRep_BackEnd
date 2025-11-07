import mongoose, { Schema, Document } from "mongoose";

export interface IStrategy extends Document {
  region: string;
  area: string;
  strategyName: string;
  route: string;
  day: string;
  mrName: string;
  doctorList: mongoose.Types.ObjectId[];
  activeRequisition: string;
}

const StrategySchema = new Schema<IStrategy>(
  {
    region: String,
    area: String,
    strategyName: String,
    route: String,
    day: String,
    activeRequisition: String,
    mrName: String,
    doctorList: [
      {
        type: Schema.Types.ObjectId,
        ref: "Doctor", // 👈 this MUST match your Doctor model name
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IStrategy>("Strategy", StrategySchema);
