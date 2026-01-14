import Joi from "joi";

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const medicineSchema = Joi.object({
  medicineId: Joi.string().pattern(objectIdRegex).required().messages({
    "any.required": "Medicine ID is required",
    "string.pattern.base": "Invalid Medicine ID (must be ObjectId)",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    "any.required": "Quantity is required",
    "number.base": "Quantity must be a number",
    "number.min": "Quantity must be at least 1",
  }),
});

export const validateOrderData = (data: any) => {
  const schema = Joi.object({
    mrName: Joi.string().required().messages({
      "string.empty": "MR Name cannot be empty",
      "any.required": "MR Name is required",
    }),
    distributorName: Joi.string().required().messages({
      "string.empty": "Distributor Name cannot be empty",
      "any.required": "Distributor Name is required",
    }),

    pharmacyId: Joi.string().pattern(objectIdRegex).required().messages({
      "any.required": "Pharmacy ID is required",
      "string.pattern.base": "Invalid Pharmacy ID (must be ObjectId)",
    }),

    address: Joi.string().required().messages({
      "any.required": "Address is required",
      "string.empty": "Address cannot be empty",
    }),

    medicines: Joi.array().min(1).items(medicineSchema).required().messages({
      "any.required": "Medicines are required",
      "array.base": "Medicines must be an array",
      "array.min": "At least one medicine is required",
    }),
    IStatus: Joi.boolean().required().messages({
      "any.required": "AddStatusress is required",
    }),
    discount: Joi.number().min(0).default(0).messages({
      "number.base": "Discount must be a number",
      "number.min": "Discount cannot be negative",
    }),
  });

  return schema.validate(data);
};
