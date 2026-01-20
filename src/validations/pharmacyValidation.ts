import Joi from "joi";

export const validatePharmacyData = (data: any) => {
  const schema = Joi.object({
    docId: Joi.string().optional().messages({
      "string.base": "Doctor ID must be a string",
    }),
    name: Joi.string().optional().allow("").messages({
      "string.base": "Name must be a string",
    }),
    email: Joi.string().email().optional().allow("").messages({
      "string.email": "Invalid email format",
    }),
    phone: Joi.string().optional().allow("").messages({
      "string.base": "Phone must be a string",
    }),
    DSL: Joi.string().optional().allow(""),
    // channel: Joi.string().optional().allow("").messages({
    //   "string.base": "channel must be a string",
    // }),
    startTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .optional()
      .allow("")
      .messages({
        "string.pattern.base": "Start time must be in HH:mm format",
      }),
    endTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .optional()
      .allow("")
      .messages({
        "string.pattern.base": "End time must be in HH:mm format",
      }),
    brick: Joi.string().optional().allow(""),
    pharmacyClass: Joi.string().optional().allow(""),
    city: Joi.string().optional().allow(""),
    affiliation: Joi.string().optional().allow(""),
    image: Joi.string().uri().optional().allow("").messages({
      "string.uri": "Image must be a valid URL",
    }),
    location: Joi.object({
      address: Joi.string().optional().allow(""),
      lat: Joi.number().optional(),
      lng: Joi.number().optional(),
    }).optional(),
  });

  return schema.validate(data, { abortEarly: false });
};
