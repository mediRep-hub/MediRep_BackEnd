import Joi from "joi";

// -------------------- Validation for creating a Brick --------------------
export const validateCreateBrick = (data: any) => {
  const schema = Joi.object({
    brickName: Joi.string().trim().min(2).max(50).required().messages({
      "string.empty": "Brick Name is required",
      "string.min": "Brick Name must be at least 2 characters",
      "string.max": "Brick Name must be at most 50 characters",
    }),
    city: Joi.string().trim().required().messages({
      "string.empty": "City is required",
    }),
    mrName: Joi.string().trim().required().messages({
      "string.empty": "MR Name is required",
    }),
    areas: Joi.array().items(Joi.string().trim()).messages({
      "array.base": "Areas must be an array of strings",
    }),
    pharmacies: Joi.array().items(Joi.string().trim()).messages({
      "array.base": "Pharmacies must be an array of strings",
    }),
    doctors: Joi.array().items(Joi.string().trim()).messages({
      "array.base": "Doctors must be an array of strings",
    }),
    products: Joi.array()
      .items(Joi.string().trim())
      .min(1)
      .required()
      .messages({
        "array.base": "Products must be an array of strings",
        "array.min": "At least one product is required",
      }),
  });

  return schema.validate(data, { abortEarly: false });
};

// -------------------- Validation for updating a Brick --------------------
export const validateUpdateBrick = (data: any) => {
  const schema = Joi.object({
    brickName: Joi.string().trim().min(2).max(50).messages({
      "string.empty": "Brick Name is required",
      "string.min": "Brick Name must be at least 2 characters",
      "string.max": "Brick Name must be at most 50 characters",
    }),
    city: Joi.string().trim().messages({
      "string.empty": "City is required",
    }),
    mrName: Joi.string().trim().messages({
      "string.empty": "MR Name is required",
    }),
    areas: Joi.array().items(Joi.string().trim()).messages({
      "array.base": "Areas must be an array of strings",
    }),
    pharmacies: Joi.array().items(Joi.string().trim()).messages({
      "array.base": "Pharmacies must be an array of strings",
    }),
    doctors: Joi.array().items(Joi.string().trim()).messages({
      "array.base": "Doctors must be an array of strings",
    }),
    products: Joi.array().items(Joi.string().trim()).messages({
      "array.base": "Products must be an array of strings",
    }),
  });

  return schema.validate(data, { abortEarly: false });
};
