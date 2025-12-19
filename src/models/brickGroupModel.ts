import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  target: { type: Number, required: true },
  bonus: { type: Number, required: true },
  amount: { type: Number, required: true },
});

const SalesGroupSchema = new mongoose.Schema(
  {
    groupName: { type: String, required: true },
    groupType: { type: String, required: true },
    region: { type: String, required: true },
    area: { type: String, required: true },
    doctors: [{ type: String, required: true }],
    manager: { type: String, required: true },
    teamLead: { type: String, required: true },
    period: { type: String, required: true },
    distributorName: { type: String, required: true },
    mr: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
    ],
    products: [ProductSchema],
  },
  { timestamps: true }
);

export default mongoose.model("SalesGroup", SalesGroupSchema);
