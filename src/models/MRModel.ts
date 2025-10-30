import mongoose from "mongoose";

const mrSchema = new mongoose.Schema(
  {
    mrId: {
      type: String,
      required: true,
      unique: true,
    },
    mrName: {
      type: String,
      required: true,
    },
    phoneNo: {
      type: String,
      required: true,
      unique: true,
    },
    region: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    strategy: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const MR = mongoose.model("MR", mrSchema);
export default MR;
