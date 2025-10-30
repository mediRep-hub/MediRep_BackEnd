import Joi from "joi";

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

export const validateApplicationData = (data: any) => {
  const schema = Joi.object({
    candidateName: Joi.string().required().messages({
      "string.empty": "Candidate name cannot be empty",
      "any.required": "Candidate name is required",
    }),
    phoneNumber: Joi.string().required().messages({
      "string.empty": "Phone number cannot be empty",
      "any.required": "Phone number is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Please enter a valid email address",
      "any.required": "Email is required",
    }),
    cv: Joi.string().required().messages({
      "string.empty": "CV cannot be empty",
      "any.required": "CV is required",
    }),
    jobId: Joi.string().pattern(objectIdRegex).required().messages({
      "string.empty": "Job ID cannot be empty",
      "any.required": "Job ID is required",
      "string.pattern.base": "Job ID must be a valid MongoDB ObjectId",
    }),
  });

  return schema.validate(data);
};
