const Joi = require("joi");

const feedbackSchema = Joi.object({
  customer_id: Joi.string().max(10).required().messages({
    "string.base": "customer_id must be a string",
    "any.required": "customer_id is required",
  }),
  stall_id: Joi.string().max(10).required().messages({
    "string.base": "stall_id must be a string",
    "any.required": "stall_id is required",
  }),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.min": "rating must be between 1 and 5",
    "number.max": "rating must be between 1 and 5",
    "any.required": "rating is required",
  }),
  comments: Joi.string().max(500).allow("", null).messages({
    "string.max": "comments cannot exceed 500 characters",
  }),
});

// For updates - only rating/comments can change, no need to resend customer_id/stall_id
const updateFeedbackSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.min": "rating must be between 1 and 5",
    "number.max": "rating must be between 1 and 5",
    "any.required": "rating is required",
  }),
  comments: Joi.string().max(500).allow("", null).messages({
    "string.max": "comments cannot exceed 500 characters",
  }),
});

function validateFeedback(req, res, next) {
  const { error } = feedbackSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map((d) => d.message).join(", ");
    return res.status(400).json({ error: errorMessage });
  }
  next();
}

function validateUpdateFeedback(req, res, next) {
  const { error } = updateFeedbackSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map((d) => d.message).join(", ");
    return res.status(400).json({ error: errorMessage });
  }
  next();
}

function validateFeedbackId(req, res, next) {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid feedback ID. ID must be a positive number" });
  }
  next();
}

module.exports = {
  validateFeedback,
  validateUpdateFeedback,
  validateFeedbackId,
};
