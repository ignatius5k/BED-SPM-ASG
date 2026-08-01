const Joi = require("joi");

const stallQuerySchema = Joi.object({
  centreId: Joi.string().trim().max(10).required(),
  customerStallId: Joi.string().trim().max(20).required(),
});

const createFeedbackSchema = Joi.object({
  centreId: Joi.string().trim().max(10).required(),
  customerStallId: Joi.string().trim().max(20).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comments: Joi.string().trim().max(500).allow("").default(""),
});

const updateFeedbackSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comments: Joi.string().trim().max(500).allow("").default(""),
});

function sendValidationError(res, error) {
  const message = error.details
    .map((detail) => detail.message.replaceAll('"', ""))
    .join(", ");

  return res.status(400).json({ error: message });
}

function validateFeedbackQuery(req, res, next) {
  const { error, value } = stallQuerySchema.validate(req.query, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (error) {
    return sendValidationError(res, error);
  }

  req.validatedFeedbackQuery = value;
  next();
}

function validateCreateFeedback(req, res, next) {
  const { error, value } = createFeedbackSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (error) {
    return sendValidationError(res, error);
  }

  req.body = value;
  next();
}

function validateUpdateFeedback(req, res, next) {
  const { error, value } = updateFeedbackSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (error) {
    return sendValidationError(res, error);
  }

  req.body = value;
  next();
}

function validateFeedbackId(req, res, next) {
  const feedbackId = Number(req.params.feedbackId);

  if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
    return res.status(400).json({
      error: "Feedback ID must be a positive whole number",
    });
  }

  req.feedbackId = feedbackId;
  next();
}

module.exports = {
  validateFeedbackQuery,
  validateCreateFeedback,
  validateUpdateFeedback,
  validateFeedbackId,
};
