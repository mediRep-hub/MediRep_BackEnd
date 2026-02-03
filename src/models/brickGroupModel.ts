import mongoose, { Schema, Document, Types } from "mongoose";

// ---------------- PRODUCT SUBDOCUMENT ----------------
export interface IProduct {
  name: string;
  target: number;
  bonus: number;
  amount: number;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    target: { type: Number, required: true },
    bonus: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }, // optional, prevents creating a new _id for each product
);

// ---------------- GROUP DOCUMENT ----------------
export interface IGroup extends Document {
  groupName: string;
  groupType: string;
  region: string;
  area: string;
  doctorList: string[];
  manager: string;
  teamLead: string;
  activePeriod: string;
  distributor: string;
  mr: Types.ObjectId[];
  products: IProduct[];
}

const GroupSchema = new Schema<IGroup>(
  {
    groupName: { type: String, required: true },
    groupType: { type: String, required: true },
    region: { type: String, required: true },
    area: { type: String, required: true },
    doctorList: [{ type: String, required: true }],
    manager: { type: String, required: true },
    teamLead: { type: String, required: true },
    activePeriod: { type: String, required: true },
    distributor: { type: String, required: true },
    mr: [
      {
        type: Schema.Types.ObjectId,
        ref: "Admin",
        required: true,
      },
    ],
    products: [ProductSchema],
  },
  { timestamps: true },
);

// ---------------- MODEL ----------------
const Group = mongoose.model<IGroup>("Group", GroupSchema);

export default Group;
