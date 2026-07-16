const Joi = require("joi");

const feedbackSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required().messages({
    "number.base": "customer_id must be a number",
    "any.required": "customer_id is required",
  }),
  stall_id: Joi.number().integer().positive().required().messages({
    "number.base": "stall_id must be a number",
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

function validateFeedback(req, res, next) {
  const { error } = feedbackSchema.validate(req.body, { abortEarly: false });
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
  validateFeedbackId,
};