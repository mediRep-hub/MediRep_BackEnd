import Joi from "joi";

export const validatePharmacyData = (data: any) => {
  const schema = Joi.object({
    docId: Joi.string().optional().messages({
      "string.base": "Doctor ID must be a string",
    }),
    name: Joi.string().required().messages({
      "any.required": "Name is required",
      "string.empty": "Name cannot be empty",
    }),
    email: Joi.string().email().required().messages({
      "any.required": "Email is required",
      "string.email": "Invalid email format",
    }),
    phone: Joi.string().required().messages({
      "any.required": "Phone is required",
      "string.empty": "Phone cannot be empty",
    }),
    startTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .required()
      .messages({
        "any.required": "Start time is required",
        "string.pattern.base": "Start time must be in HH:mm format",
      }),
    endTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .required()
      .messages({
        "any.required": "End time is required",
        "string.pattern.base": "End time must be in HH:mm format",
      }),
    region: Joi.string().required().messages({
      "any.required": "Region is required",
    }),
    area: Joi.string().required().messages({
      "any.required": "Area is required",
    }),
    affiliation: Joi.string().required().messages({
      "any.required": "Affiliation is required",
    }),
    image: Joi.string().uri().required().messages({
      "any.required": "Image URL is required",
      "string.uri": "Image must be a valid URL",
    }),
    location: Joi.object({
      address: Joi.string().required().messages({
        "any.required": "Address is required",
      }),
      lat: Joi.number().required().messages({
        "any.required": "Latitude is required",
        "number.base": "Latitude must be a number",
      }),
      lng: Joi.number().required().messages({
        "any.required": "Longitude is required",
        "number.base": "Longitude must be a number",
      }),
    })
      .required()
      .messages({
        "any.required": "Location is required",
      }),
  });

  return schema.validate(data, { abortEarly: false });
};
