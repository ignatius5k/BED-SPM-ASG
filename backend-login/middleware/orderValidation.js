const Joi = require("joi");

// Defines exactly what a valid order request must look like.
const createOrderSchema = Joi.object({
  stallId: Joi.string().max(10).required().messages({
    "any.required": "Stall ID is required",
    "string.empty": "Stall ID cannot be empty"
  }),
  items: Joi.array()
    .min(1)
    .items(
      Joi.object({
        menuItemId: Joi.string().max(10).required().messages({
          "any.required": "Each item needs a menu item ID",
          "string.empty": "Menu item ID cannot be empty"
        }),
        quantity: Joi.number().integer().min(1).max(99).required().messages({
          "number.base": "Quantity must be a number",
          "number.min": "Quantity must be at least 1",
          "number.max": "Quantity cannot exceed 99",
          "any.required": "Each item needs a quantity"
        })
      })
    )
    .required()
    .messages({
      "array.min": "An order must contain at least one item",
      "any.required": "Order items are required"
    })
});

// Checks the request body before it reaches the controller.
function validateCreateOrder(req, res, next) {
  const { error } = createOrderSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      error: error.details.map((d) => d.message).join(", ")
    });
  }
  next();
}

// Order IDs always look like ORD001, so anything else is rejected
// before it ever reaches the database.
function validateOrderId(req, res, next) {
  const id = req.params.id;

  if (!id || !/^ORD\d+$/.test(id)) {
    return res.status(400).json({
      error: "Invalid order ID. Expected format: ORD001"
    });
  }
  next();
}

module.exports = { validateCreateOrder, validateOrderId };