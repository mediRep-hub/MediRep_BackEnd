import Joi from "joi";

// Group validation
export const validateGroup = (data: any) => {
  const schema = Joi.object({
    groupName: Joi.string().required(),
    groupType: Joi.string().required(),
    region: Joi.string().required(),
    city: Joi.string().required(), // single string
    area: Joi.array().items(Joi.string()).min(1).required(), // array of strings
    doctorList: Joi.array().items(Joi.string()).min(1).required(),
    manager: Joi.string().required(),
    teamLead: Joi.string().required(),
    activePeriod: Joi.string().required(),
    distributor: Joi.string().required(),
    mr: Joi.array().items(Joi.string()).min(1).required(),
    products: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          target: Joi.number().required(),
          bonus: Joi.number().required(),
          amount: Joi.number().required(),
        }),
      )
      .required(),
    pharmacies: Joi.array().items(Joi.string()).min(1).required(), // array of strings
  });

  return schema.validate(data, { abortEarly: false });
};
