const Joi = require("joi");

const menuItemSchema = Joi.object({
  stallId: Joi.number().integer().positive().required().messages({
    "number.base": "Stall ID must be a number",
    "number.integer": "Stall ID must be a whole number",
    "number.positive": "Stall ID must be positive",
    "any.required": "Stall ID is required",
  }),
  itemName: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Item name cannot be empty",
    "string.min": "Item name must be at least 2 characters",
    "string.max": "Item name cannot exceed 100 characters",
    "any.required": "Item name is required",
  }),
  description: Joi.string().allow("", null).max(500).messages({
    "string.max": "Description cannot exceed 500 characters",
  }),
  price: Joi.number().precision(2).positive().max(9999.99).required().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be greater than 0",
    "number.max": "Price cannot exceed 9999.99",
    "any.required": "Price is required",
  }),
  category: Joi.string()
    .valid("Main Dish", "Drink", "Dessert", "Side", "Set Meal")
    .required()
    .messages({
      "any.only": "Category must be Main Dish, Drink, Dessert, Side, or Set Meal",
      "any.required": "Category is required",
    }),
  isAvailable: Joi.boolean().default(true),
  imageUrl: Joi.string().uri().allow("", null).max(500).messages({
    "string.uri": "Image URL must be a valid URL",
    "string.max": "Image URL cannot exceed 500 characters",
  }),
});

const searchSchema = Joi.object({
  stallId: Joi.number().integer().positive(),
  category: Joi.string().valid("Main Dish", "Drink", "Dessert", "Side", "Set Meal"),
  searchTerm: Joi.string().trim().max(100),
  availableOnly: Joi.string().valid("true", "false"),
});

function formatJoiError(error) {
  return error.details.map((detail) => detail.message).join(", ");
}

function validateMenuItem(req, res, next) {
  const { error, value } = menuItemSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({ message: formatJoiError(error) });
  }

  req.body = value;
  next();
}

function validateMenuItemId(req, res, next) {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ message: "Menu item ID must be a positive number" });
  }

  next();
}

function validateMenuItemSearch(req, res, next) {
  const { error } = searchSchema.validate(req.query, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (error) {
    return res.status(400).json({ message: formatJoiError(error) });
  }

  next();
}

module.exports = {
  validateMenuItem,
  validateMenuItemId,
  validateMenuItemSearch,
};
