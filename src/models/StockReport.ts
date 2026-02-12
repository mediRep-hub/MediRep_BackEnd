import mongoose from "mongoose";

const stockReportSchema = new mongoose.Schema(
  {
    itemDescription: { type: String, required: true },
    rate: { type: Number, default: 0 },

    openingBalance: { type: Number, default: 0 },
    purchase: { type: Number, default: 0 },
    purchaseReturn: { type: Number, default: 0 },
    purchaseTotal: { type: Number, default: 0 },

    sale: { type: Number, default: 0 },
    saleReturn: { type: Number, default: 0 },
    saleTotal: { type: Number, default: 0 },

    adjustment: { type: Number, default: 0 },

    closingBalance: { type: Number, default: 0 },
    closingValue: { type: Number, default: 0 },

    todaySale: { type: Number, default: 0 },
    todayReturn: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("StockReport", stockReportSchema);
