const promotionModel = require("../models/promotionModel");
const {
  validatePromotionList,
} = require("../middleware/promotionValidation");
const {
  sendPromotionEmail,
} = require("../services/promotionEmailService");

async function getAllPromotions(req, res) {
  try {
    const promotions = await promotionModel.getAllPromotions();
    res.json(validatePromotionList(promotions));
  } catch (error) {
    console.error("Controller error in getAllPromotions:", error);
    res.status(500).json({ error: "Error retrieving promotions" });
  }
}

async function createPromotion(req, res) {
  try {
    const promotion = await promotionModel.createPromotion(req.body);

    if (!promotion) {
      return res.status(404).json({
        error: "The selected stall was not found",
      });
    }

    const validatedPromotion = validatePromotionList([promotion])[0];
    const notification = await sendPromotionEmail(validatedPromotion);

    res.status(201).json({
      ...validatedPromotion,
      emailSent: notification.sent,
      message: notification.sent
        ? "Promotion created and notification email sent"
        : "Promotion created, but the notification email was not sent",
    });
  } catch (error) {
    console.error("Controller error in createPromotion:", error);
    res.status(500).json({ error: "Error creating promotion" });
  }
}

module.exports = {
  getAllPromotions,
  createPromotion,
};
