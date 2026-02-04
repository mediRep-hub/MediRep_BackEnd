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
  { _id: false },
);

// ---------------- GROUP DOCUMENT ----------------
export interface IGroup extends Document {
  groupId: string; // new custom group ID
  groupName: string;
  groupType: string;
  region: string;
  city: string; // single string
  area: string[]; // array of strings
  doctorList: string[];
  manager: string;
  teamLead: string;
  activePeriod: string;
  distributor: string;
  mr: string[];
  products: IProduct[];
  pharmacies: string[]; // array of strings
}

const GroupSchema = new Schema<IGroup>(
  {
    groupId: { type: String, unique: true }, // new auto-generated ID
    groupName: { type: String, required: true },
    groupType: { type: String, required: true },
    region: { type: String, required: true },
    city: { type: String, required: true }, // single string
    area: { type: [String], required: true }, // array
    doctorList: [{ type: String, required: true }],
    manager: { type: String, required: true },
    teamLead: { type: String, required: true },
    activePeriod: { type: String, required: true },
    distributor: { type: String, required: true },
    mr: [{ type: Schema.Types.ObjectId, ref: "Admin" }],

    products: [ProductSchema],
    pharmacies: [{ type: String, required: true }], // array
  },
  { timestamps: true },
);

// ---------------- PRE-SAVE HOOK TO GENERATE groupId ----------------
GroupSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Find the last created group and get its number
    const lastGroup = await mongoose
      .model<IGroup>("Group")
      .findOne({})
      .sort({ createdAt: -1 })
      .exec();

    let newNumber = 1;
    if (lastGroup && lastGroup.groupId) {
      const lastNumber = parseInt(lastGroup.groupId.replace("GRP", ""), 10);
      newNumber = lastNumber + 1;
    }

    // Format as GRP001, GRP002, etc.
    this.groupId = `GRP${newNumber.toString().padStart(3, "0")}`;
  }
  next();
});

// ---------------- MODEL ----------------
const Group = mongoose.model<IGroup>("Group", GroupSchema);

export default Group;
