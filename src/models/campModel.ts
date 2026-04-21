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
    mrName: {
      type: String,
      required: true,
    },
    brickCode: {
      type: String,
      required: true,
    },
    patients: {
      type: [
        {
          patientId: {
            type: String,
            unique: true,
          },
          name: { type: String, required: true },
          gender: { type: String, required: true },
          weight: { type: Number, required: true },
          age: { type: Number, required: true },
          contactNo: { type: String, required: true },
          address: { type: String, required: true },
          sampleDate: { type: Date, required: true },
        },
      ],
      default: [],
    },

    status: {
      type: String,
      enum: ["pending", "approved", "completed", "rejected"],
      default: "pending",
    },

    chemists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pharmacy",
      },
    ],
    doctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
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
