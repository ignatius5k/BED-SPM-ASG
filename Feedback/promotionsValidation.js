const Joi = require("joi");

const promotionSchema = Joi.object({
  stall_id: Joi.number().integer().positive().required().messages({
    "number.base": "stall_id must be a number",
    "any.required": "stall_id is required",
  }),
  title: Joi.string().max(100).required().messages({
    "string.empty": "title cannot be empty",
    "string.max": "title cannot exceed 100 characters",
    "any.required": "title is required",
  }),
  description: Joi.string().max(500).required().messages({
    "string.empty": "description cannot be empty",
    "string.max": "description cannot exceed 500 characters",
    "any.required": "description is required",
  }),
  discount: Joi.string().max(50).required().messages({
    "string.empty": "discount cannot be empty",
    "string.max": "discount cannot exceed 50 characters",
    "any.required": "discount is required",
  }),
});

const updatePromotionSchema = Joi.object({
  title: Joi.string().max(100).required().messages({
    "string.empty": "title cannot be empty",
    "string.max": "title cannot exceed 100 characters",
    "any.required": "title is required",
  }),
  description: Joi.string().max(500).required().messages({
    "string.empty": "description cannot be empty",
    "string.max": "description cannot exceed 500 characters",
    "any.required": "description is required",
  }),
  discount: Joi.string().max(50).required().messages({
    "string.empty": "discount cannot be empty",
    "string.max": "discount cannot exceed 50 characters",
    "any.required": "discount is required",
  }),
});

function validatePromotion(req, res, next) {
  const { error } = promotionSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map((d) => d.message).join(", ");
    return res.status(400).json({ error: errorMessage });
  }
  next();
}

function validateUpdatePromotion(req, res, next) {
  const { error } = updatePromotionSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map((d) => d.message).join(", ");
    return res.status(400).json({ error: errorMessage });
  }
  next();
}

function validatePromotionId(req, res, next) {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid promotion ID. ID must be a positive number" });
  }
  next();
}

module.exports = {
  validatePromotion,
  validateUpdatePromotion,
  validatePromotionId,
};