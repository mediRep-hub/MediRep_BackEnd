import Joi from "joi";

const objectIdRegex = /^[a-fA-F0-9]{24}$/;
export const validateAddCallReport = (data: any) => {
  const schema = Joi.object({
    mrName: Joi.string().pattern(objectIdRegex).required().messages({
      "any.required": "MR ID is required",
      "string.empty": "MR ID cannot be empty",
      "string.pattern.base": "Invalid MR ID (must be a valid ObjectId)",
    }),
    doctorList: Joi.array()
      .items(
        Joi.string().pattern(objectIdRegex).required().messages({
          "any.required": "Doctor ID is required",
          "string.pattern.base": "Invalid Doctor ID (must be ObjectId)",
        })
      )
      .min(1)
      .required()
      .messages({
        "array.base": "Doctor list must be an array",
        "array.min": "At least one doctor is required",
        "any.required": "Doctor list is required",
      }),
    region: Joi.string().optional(),
    area: Joi.string().optional(),
    route: Joi.string().optional(),
    strategyName: Joi.string().optional(),
    day: Joi.string().optional(),
    remarks: Joi.string().optional(),
    date: Joi.date().optional(),
  }).unknown(true);

  return schema.validate(data, { abortEarly: false });
};

export const validateCheckLocation = (data: any) => {
  const schema = Joi.object({
    callReportId: Joi.string().pattern(objectIdRegex).required().messages({
      "any.required": "Call Report ID is required",
      "string.pattern.base": "Invalid Call Report ID",
    }),
    doctorId: Joi.string().pattern(objectIdRegex).required().messages({
      "any.required": "Doctor ID is required",
      "string.pattern.base": "Invalid Doctor ID",
    }),
    lat: Joi.number().required().messages({
      "any.required": "Latitude is required",
      "number.base": "Latitude must be a number",
    }),
    lng: Joi.number().required().messages({
      "any.required": "Longitude is required",
      "number.base": "Longitude must be a number",
    }),
  });

  return schema.validate(data, { abortEarly: false });
};
