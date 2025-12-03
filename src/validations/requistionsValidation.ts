import Joi from "joi";

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const doctorListSchema = Joi.object({
  doctorId: Joi.string().pattern(objectIdRegex).required().messages({
    "any.required": "Doctor ID is required",
    "string.pattern.base": "Invalid Doctor ID",
  }),
  doctorName: Joi.string().required().messages({
    "any.required": "Doctor Name is required",
    "string.empty": "Doctor Name cannot be empty",
  }),
});

const productSchema = Joi.object({
  name: Joi.string().required(),
  quantity: Joi.number().min(1).required(),
});

export const validateRequisitionData = (data: any) => {
  const schema = Joi.object({
    mrName: Joi.string().required(),

    doctorList: Joi.array().items(doctorListSchema).min(1).required().messages({
      "array.base": "doctorList must be an array",
      "array.min": "At least 1 doctor entry is required",
      "any.required": "doctorList is required",
    }),

    region: Joi.string().optional(),
    strategyName: Joi.string().optional(),
    route: Joi.string().optional(),
    day: Joi.string().optional(),

    status: Joi.string().optional(),

    attachedDoc: Joi.string().required(),

    details: Joi.string().required(),

    product: Joi.array().items(productSchema).min(1).required(),

    startingDate: Joi.date().required(),

    accepted: Joi.boolean().optional(),
    remarks: Joi.string().optional(),
    totalQuantity: Joi.number().optional(),
    duration: Joi.string().optional(),

    requisitionType: Joi.string()
      .valid("cash", "other", "house", "car", "tour")
      .required(),

    amount: Joi.number().when("requisitionType", {
      is: "cash",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }).unknown(true); // ← allows extra fields (safe option)

  return schema.validate(data, { abortEarly: false });
};
