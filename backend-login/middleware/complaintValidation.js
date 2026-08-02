const Joi = require("joi");

const VALID_CATEGORIES = [
  "Cleanliness",
  "Food Quality",
  "Service Quality",
  "Waiting Time",
  "Others",
];

const createComplaintSchema = Joi.object({
  centreId: Joi.string().trim().max(10).required(),
  customerStallId: Joi.string().trim().max(20).required(),
  category: Joi.string()
    .trim()
    .valid(...VALID_CATEGORIES)
    .required(),
  description: Joi.string().trim().min(1).max(500).required(),
});

function validateCreateComplaint(req, res, next) {
  const { error, value } = createComplaintSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (error) {
    const message = error.details
      .map((detail) => detail.message.replaceAll('"', ""))
      .join(", ");

    return res.status(400).json({ error: message });
  }

  req.body = value;
  next();
}

module.exports = {
  validateCreateComplaint,
};
