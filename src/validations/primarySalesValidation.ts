import Joi from "joi";

// Product validation schema
const productSchema = Joi.object({
  sku: Joi.string().required().messages({
    "string.empty": "SKU is required",
  }),
  productName: Joi.string().required().messages({
    "string.empty": "Product name is required",
  }),
  openBalance: Joi.number().min(0).default(0),
  purchaseQNT: Joi.number().min(0).default(0),
  purchaseReturn: Joi.number().min(0).default(0),
  saleReturnQNT: Joi.number().min(0).default(0),
  netSale: Joi.number().min(0).default(0),
  floorStockValue: Joi.number().min(0).default(0),
  saleQty: Joi.number().min(0).default(0),
});

// Distributor validation schema
export const distributorValidationSchema = Joi.object({
  distributorName: Joi.string().required().messages({
    "string.empty": "Distributor Name is required",
  }),
  area: Joi.string().required().messages({
    "string.empty": "Area is required",
  }),
  primarySale: Joi.number().min(0).default(0),
  totalSaleQNT: Joi.number().min(0).default(0),
  floorStockQNT: Joi.number().min(0).default(0),
  floorStockValue: Joi.number().min(0).default(0),
  status: Joi.string().valid("active", "inactive").default("active"),
  products: Joi.array().items(productSchema).min(1).messages({
    "array.min": "At least one product is required",
  }),
});
