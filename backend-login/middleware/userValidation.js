const Joi = require("joi");

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .required()
  .messages({
    "string.min": "Password must be at least 8 characters long",
    "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  }),
  role: Joi.string().valid("customer", "vendor", "inspector").required(),

  badgeNumber: Joi.string().max(20).when("role", {
    is: "inspector",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  department: Joi.string().max(100).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Current password is required",
    "string.empty": "Current password cannot be empty"
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.min": "New password must be at least 8 characters long",
      "string.pattern.base":
        "New password must contain at least one uppercase letter, one lowercase letter, and one number",
      "any.required": "New password is required"
    })
});

function validateRegister(req, res, next) {
  const { error } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ error: error.details.map((d) => d.message).join(", ") });
  }
  next();
}

function validateLogin(req, res, next) {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ error: error.details.map((d) => d.message).join(", ") });
  }
  next();
}

function validateChangePassword(req, res, next) {
  const { error } = changePasswordSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: error.details.map((d) => d.message).join(", ")
    });
  }
  next();
}

module.exports = { validateRegister, validateLogin };
module.exports = { validateRegister, validateLogin, validateChangePassword };