const Joi = require("joi");

const complaintSchema = Joi.object({
  customer_id: Joi.string().max(10).required().messages({
    "string.base": "customer_id must be a string",
    "any.required": "customer_id is required",
  }),
  stall_id: Joi.string().max(10).required().messages({
    "string.base": "stall_id must be a string",
    "any.required": "stall_id is required",
  }),
  complaint_type: Joi.string().max(50).required().messages({
    "string.empty": "complaint_type cannot be empty",
    "string.max": "complaint_type cannot exceed 50 characters",
    "any.required": "complaint_type is required",
  }),
  description: Joi.string().min(1).max(500).required().messages({
    "string.empty": "description cannot be empty",
    "string.max": "description cannot exceed 500 characters",
    "any.required": "description is required",
  }),
});

// For updates - only status can change
const updateComplaintSchema = Joi.object({
  status: Joi.string().valid("Pending", "In Progress", "Resolved").required().messages({
    "any.only": "status must be one of: Pending, In Progress, Resolved",
    "any.required": "status is required",
  }),
});

function validateComplaint(req, res, next) {
  const { error } = complaintSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map((d) => d.message).join(", ");
    return res.status(400).json({ error: errorMessage });
  }
  next();
}

function validateUpdateComplaint(req, res, next) {
  const { error } = updateComplaintSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map((d) => d.message).join(", ");
    return res.status(400).json({ error: errorMessage });
  }
  next();
}

function validateComplaintId(req, res, next) {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid complaint ID. ID must be a positive number" });
  }
  next();
}

module.exports = {
  validateComplaint,
  validateUpdateComplaint,
  validateComplaintId,
};
