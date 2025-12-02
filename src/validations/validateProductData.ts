import Joi from "joi";

const skuRegex = /^[A-Z]{3}-\d{4}$/;

export const validateProductData = (data: any) => {
  const schema = Joi.object({
    productName: Joi.string().min(2).max(100).required().messages({
      "any.required": "Product Name is required",
      "string.empty": "Product Name cannot be empty",
      "string.min": "Product Name must be at least 2 characters",
      "string.max": "Product Name cannot exceed 100 characters",
    }),
    category: Joi.string().required().messages({
      "any.required": "Category is required",
      "string.empty": "Category cannot be empty",
    }),
    isfrom: Joi.string().required().messages({
      "any.required": "isfrom field is required",
      "string.empty": "isfrom cannot be empty",
    }),
    amount: Joi.number().positive().required().messages({
      "any.required": "Amount is required",
      "number.base": "Amount must be a number",
      "number.positive": "Amount must be a positive number",
    }),
    productImage: Joi.string().uri().required().messages({
      "any.required": "Product Image is required",
      "string.uri": "Product Image must be a valid URL",
    }),
    strength: Joi.string().required().messages({
      "any.required": "Strength is required",
      "string.empty": "Strength cannot be empty",
    }),
    isStatus: Joi.string().valid("active", "inactive").required().messages({
      "any.required": "Status is required",
      "any.only": "Status must be either 'active' or 'inactive'",
    }),
    sku: Joi.string().pattern(skuRegex).optional().messages({
      "string.pattern.base": "SKU format is invalid (Example: ABC-1234)",
    }),
    packSize: Joi.string().required().messages({
      "any.required": "Pack Size is required",
      "string.empty": "Pack Size cannot be empty",
    }),
    achievement: Joi.number().min(0).optional().messages({
      "number.base": "Achievement must be a number",
      "number.min": "Achievement cannot be negative",
    }),
    target: Joi.number().min(0).optional().messages({
      "number.base": "Target must be a number",
      "number.min": "Target cannot be negative",
    }),
  });

  return schema.validate(data, { abortEarly: false });
};
