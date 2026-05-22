const Joi = require("joi");

const registerSchema = Joi.object({
  username: Joi.string().trim().alphanum().min(3).max(50).required().messages({
    "string.alphanum": "Username must contain only letters and numbers",
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username cannot exceed 50 characters",
    "any.required": "Username is required",
  }),
  password: Joi.string().min(8).max(100).required().messages({
    "string.min": "Password must be at least 8 characters",
    "string.max": "Password cannot exceed 100 characters",
    "any.required": "Password is required",
  }),
  role: Joi.string().valid("patron", "vendor", "neaOfficer", "admin").required().messages({
    "any.only": "Role must be patron, vendor, neaOfficer, or admin",
    "any.required": "Role is required",
  }),
});

const loginSchema = Joi.object({
  username: Joi.string().trim().required().messages({
    "any.required": "Username is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(", ");
      return res.status(400).json({ message });
    }

    req.body = value;
    next();
  };
}

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
};
