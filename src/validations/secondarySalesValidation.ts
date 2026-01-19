import Joi from "joi";

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

export const primarySaleValidation = Joi.object({
  orderId: Joi.string().required(),

  mrName: Joi.string().required(),

  distributorName: Joi.string().required(),

  pharmacyId: Joi.string().pattern(objectIdRegex).required(),

  address: Joi.string().required(),

  medicines: Joi.array()
    .items(
      Joi.object({
        medicineId: Joi.string().pattern(objectIdRegex).required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    )
    .min(1)
    .required(),

  subtotal: Joi.number().min(0).required(),

  discount: Joi.number().min(0).default(0),

  total: Joi.number().min(0).required(),

  IStatus: Joi.boolean().optional(),
}).unknown(false);
