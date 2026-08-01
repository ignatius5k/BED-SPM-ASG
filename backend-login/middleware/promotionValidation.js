const Joi = require("joi");

const promotionListSchema = Joi.array().items(
  Joi.object({
    promotionId: Joi.number().integer().positive().required(),
    stallId: Joi.string().trim().max(10).required(),
    stallName: Joi.string().trim().max(100).required(),
    title: Joi.string().trim().max(100).required(),
    description: Joi.string().trim().max(500).required(),
    discount: Joi.string().trim().max(50).required(),
  })
).required();

const stallIdentifierSchema = Joi.alternatives().try(
  Joi.string().trim().pattern(/^STALL\d{3}$/i),
  Joi.number().integer().min(1).max(999)
);

const createPromotionSchema = Joi.object({
  stallId: stallIdentifierSchema,
  stall_id: stallIdentifierSchema,
  title: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().min(1).max(500).required(),
  discount: Joi.string().trim().min(1).max(50).required(),
}).xor("stallId", "stall_id");

function normalizeStallId(value) {
  if (typeof value === "number") {
    return `STALL${String(value).padStart(3, "0")}`;
  }

  return value.toUpperCase();
}

function validateCreatePromotion(req, res, next) {
  const result = createPromotionSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (result.error) {
    const errors = result.error.details.map((detail) =>
      detail.message.replaceAll('"', "")
    );

    return res.status(400).json({
      error: "Please correct the promotion details",
      errors,
    });
  }

  const stallValue = result.value.stallId ?? result.value.stall_id;
  req.body = {
    stallId: normalizeStallId(stallValue),
    title: result.value.title,
    description: result.value.description,
    discount: result.value.discount,
  };

  next();
}

function validatePromotionList(promotions) {
  const result = promotionListSchema.validate(promotions, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (result.error) {
    const error = new Error("The promotion data returned by SQL is invalid");
    error.cause = result.error;
    throw error;
  }

  return result.value;
}

module.exports = {
  validatePromotionList,
  validateCreatePromotion,
};
