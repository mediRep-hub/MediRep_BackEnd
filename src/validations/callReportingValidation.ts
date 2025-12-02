import Joi from "joi";
import mongoose from "mongoose";

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const doctorSchema = Joi.object({
  doctor: Joi.string().pattern(objectIdRegex).required().messages({
    "any.required": "Doctor ID is required",
    "string.pattern.base": "Invalid Doctor ID (must be ObjectId)",
  }),
  status: Joi.string().valid("pending", "close").optional().messages({
    "any.only": "Status must be 'pending' or 'close'",
  }),
});

export const validateAddCallReport = (data: any) => {
  const schema = Joi.object({
    mrName: Joi.string().required().messages({
      "any.required": "MR Name is required",
      "string.empty": "MR Name cannot be empty",
    }),
    doctorList: Joi.array().min(1).items(doctorSchema).required().messages({
      "any.required": "Doctor list is required",
      "array.base": "Doctor list must be an array",
      "array.min": "At least one doctor is required",
    }),
    area: Joi.string().optional(),
    remarks: Joi.string().optional(),
    date: Joi.date().optional(),
  });

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
