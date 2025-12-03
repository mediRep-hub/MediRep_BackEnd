import Joi from "joi";

export const validateProductData = (data: any) => {
  const schema = Joi.object({
    productName: Joi.string().required().messages({
      "any.required": "Product name is required",
      "string.empty": "Product name cannot be empty",
    }),

    category: Joi.string().required().messages({
      "any.required": "Category is required",
      "string.empty": "Category cannot be empty",
    }),

    isfrom: Joi.string().required().messages({
      "any.required": "Isfrom is required",
      "string.empty": "Isfrom cannot be empty",
    }),

    amount: Joi.number().required().messages({
      "any.required": "Amount is required",
      "number.base": "Amount must be a number",
    }),

    productImage: Joi.string().uri().required().messages({
      "any.required": "Product image is required",
      "string.uri": "Product image must be a valid URL",
    }),

    strength: Joi.string().required().messages({
      "any.required": "Strength is required",
      "string.empty": "Strength cannot be empty",
    }),
    specialty: Joi.string().required().messages({
      "any.required": "Specialty is required",
      "string.empty": "Specialty cannot be empty",
    }),
    isStatus: Joi.string().required().messages({
      "any.required": "Status is required",
      "string.empty": "Status cannot be empty",
    }),

    sku: Joi.string().optional().messages({
      "string.base": "SKU must be a string",
    }),

    packSize: Joi.string().required().messages({
      "any.required": "Pack size is required",
      "string.empty": "Pack size cannot be empty",
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
