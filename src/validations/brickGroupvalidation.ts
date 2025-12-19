import Joi from "joi";

export const SalesGroupValidation = Joi.object({
  groupName: Joi.string().required(),
  groupType: Joi.string().required(),
  region: Joi.string().required(),
  area: Joi.string().required(),
  doctors: Joi.array().items(Joi.string()).required(),
  manager: Joi.string().required(),
  teamLead: Joi.string().required(),
  period: Joi.string().required(),
  distributorName: Joi.string().required(),
  mr: Joi.array().items(Joi.string()).required(),
  products: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        target: Joi.number().required(),
        bonus: Joi.number().required(),
        amount: Joi.number().required(),
      })
    )
    .required(),
});
