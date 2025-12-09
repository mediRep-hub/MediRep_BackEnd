import mongoose from "mongoose";

const discountSchema = new mongoose.Schema({
  channel: {
    type: String,
    required: true,
    enum: ["RT", "Local Modern Trade", "Wholesale"],
  },
  percent: { type: Number, default: 0 },
});

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  category: { type: String, required: true },
  isfrom: { type: String, required: true },
  amount: { type: Number, required: true },
  productImage: { type: String, required: true },
  strength: { type: String, required: true },
  isStatus: { type: String, required: true },
  sku: { type: String, unique: true },
  packSize: { type: String, required: true },
  achievement: { type: Number, default: 0 },
  target: { type: Number, default: 0 },

  // ⭐ Discount array (RT always remains fixed)
  discount: {
    type: [discountSchema],
    default: [
      { channel: "RT", percent: 0 }, // RT constant
      { channel: "Local Modern Trade", percent: 0 },
      { channel: "Wholesale", percent: 0 },
    ],
  },
});

// 🔒 Ensure RT record always exists and cannot be removed
productSchema.pre("save", function (next) {
  // if RT not found, add it back
  if (!this.discount.some((d) => d.channel === "RT")) {
    this.discount.push({ channel: "RT", percent: 0 });
  }

  next();
});

// 🔧 SKU Auto-generate
productSchema.pre("save", function (next) {
  if (!this.sku) {
    const prefix = this.productName
      .substring(0, 3)
      .toUpperCase()
      .replace(/\s+/g, "");

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.sku = `${prefix}-${randomNum}`;
  }
  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
