import mongoose from "mongoose";

const campSchema = new mongoose.Schema(
  {
    campType: {
      type: String,
      required: true,
    },
    sampleType: {
      type: String,
      required: true,
    },
    campTime: {
      type: String,
      required: true,
    },
    campStartDate: {
      type: Date,
      required: true,
    },
    campEndDate: {
      type: Date,
      required: true,
    },
    mrType: {
      type: String,
      required: true,
    },
    brickCode: {
      type: String,
      required: true,
    },

    // ✅ NEW STATUS FIELD
    status: {
      type: String,
      enum: ["pending", "approved", "completed"],
      default: "pending",
    },

    chemists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pharmacy",
      },
    ],

    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Camp", campSchema);
