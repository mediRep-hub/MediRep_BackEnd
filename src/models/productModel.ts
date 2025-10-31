import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  category: { type: String, required: true },
  isfrom: { type: String, required: true },
  amount: { type: Number, required: true },
  productImage: { type: String, required: true },
  isStatus: { type: String, required: true },
  sku: { type: String, unique: true },

  achievement: { type: Number, default: 0 },
  target: { type: Number, default: 0 },
});

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
