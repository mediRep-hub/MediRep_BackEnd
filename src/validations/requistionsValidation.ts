import Joi from "joi";
import mongoose from "mongoose";

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const productSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Product name is required",
    "string.empty": "Product name cannot be empty",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    "any.required": "Product quantity is required",
    "number.base": "Quantity must be a number",
    "number.min": "Quantity must be at least 1",
  }),
});

export const validateRequisitionData = (data: any) => {
  const schema = Joi.object({
    mrName: Joi.string().required().messages({
      "any.required": "MR Name is required",
      "string.empty": "MR Name cannot be empty",
    }),
    doctor: Joi.string().pattern(objectIdRegex).required().messages({
      "any.required": "Doctor ID is required",
      "string.pattern.base": "Invalid Doctor ID",
    }),
    doctorName: Joi.string().required().messages({
      "any.required": "Doctor Name is required",
      "string.empty": "Doctor Name cannot be empty",
    }),
    status: Joi.string().optional(),
    attachedDoc: Joi.string().required().messages({
      "any.required": "Attached document is required",
      "string.empty": "Attached document cannot be empty",
    }),
    details: Joi.string().required().messages({
      "any.required": "Details are required",
      "string.empty": "Details cannot be empty",
    }),
    product: Joi.array().min(1).items(productSchema).required().messages({
      "any.required": "Product list is required",
      "array.min": "At least one product is required",
    }),
    startingDate: Joi.date().required().messages({
      "any.required": "Starting date is required",
      "date.base": "Starting date must be a valid date",
    }),
    accepted: Joi.boolean().optional(),
    remarks: Joi.string().optional(),
    totalQuantity: Joi.number().optional(),
    duration: Joi.string().optional(),
    amount: Joi.number().when("requisitionType", {
      is: "cash",
      then: Joi.required().messages({
        "any.required": "Amount is required for cash requisition",
      }),
      otherwise: Joi.optional(),
    }),
    requisitionType: Joi.string()
      .valid("cash", "other", "house", "car", "tour")
      .required()
      .messages({
        "any.only":
          "Requisition type must be one of cash, other, house, car, tour",
        "any.required": "Requisition type is required",
      }),
  });

  return schema.validate(data, { abortEarly: false });
};
