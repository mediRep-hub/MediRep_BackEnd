import Joi from "joi";

// Example for Group validation
export const validateGroup = (data: any) => {
  const schema = Joi.object({
    groupName: Joi.string().required(),
    groupType: Joi.string()
      .valid(...["Sales", "Marketing", "Operations"])
      .required(),
    region: Joi.string().required(),
    area: Joi.string().required(),
    doctorList: Joi.array().items(Joi.string()).required(),
    manager: Joi.string().required(),
    teamLead: Joi.string().required(),
    activePeriod: Joi.string().required(),
    distributor: Joi.string().required(),
    mr: Joi.array().items(Joi.string()).required(),
    products: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        target: Joi.number().required(),
        bonus: Joi.number().required(),
        amount: Joi.number().required(),
      }),
    ),
  });

  return schema.validate(data, { abortEarly: false });
};
