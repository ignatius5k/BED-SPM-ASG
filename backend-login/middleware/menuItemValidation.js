const Joi = require("joi");

const cuisineListSchema = Joi.array()
  .items(Joi.string().trim().min(2).max(50))
  .min(1)
  .max(5)
  .unique()
  .required();

const menuItemFields = {
  itemName: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().allow("").max(500).required(),
  price: Joi.number().precision(2).min(0.5).max(9999.99).required(),
  category: Joi.string().trim().min(2).max(50).required(),
  cuisines: cuisineListSchema,
  isAvailable: Joi.boolean().required(),
};

const createMenuItemSchema = Joi.object({
  stallId: Joi.string().trim().max(10).required(),
  ...menuItemFields,
});

const updateMenuItemSchema = Joi.object(menuItemFields);

function validateWithSchema(schema, req, res, next) {
  const result = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
  });

  if (result.error) {
    const messages = result.error.details.map((detail) => detail.message);

    return res.status(400).json({
      message: "Please correct the menu item details",
      errors: messages,
    });
  }

  req.body = result.value;
  next();
}

function validateCreateMenuItem(req, res, next) {
  validateWithSchema(createMenuItemSchema, req, res, next);
}

function validateUpdateMenuItem(req, res, next) {
  validateWithSchema(updateMenuItemSchema, req, res, next);
}

module.exports = {
  validateCreateMenuItem,
  validateUpdateMenuItem,
};
