const promotionModel = require("./promotionsModel");

async function getAllPromotions(req, res) {
  try {
    const promotions = await promotionModel.getAllPromotions();
    res.json(promotions);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving promotions" });
  }
}

async function getPromotionById(req, res) {
  try {
    const id = parseInt(req.params.id);
    const promotion = await promotionModel.getPromotionById(id);
    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }
    res.json(promotion);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving promotion" });
  }
}

async function createPromotion(req, res) {
  try {
    const newPromotion = await promotionModel.createPromotion(req.body);
    res.status(201).json(newPromotion);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error creating promotion" });
  }
}

async function updatePromotion(req, res) {
  try {
    const id = parseInt(req.params.id);
    const existing = await promotionModel.getPromotionById(id);
    if (!existing) {
      return res.status(404).json({ error: "Promotion not found" });
    }
    const updated = await promotionModel.updatePromotion(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error updating promotion" });
  }
}

async function deletePromotion(req, res) {
  try {
    const id = parseInt(req.params.id);
    const existing = await promotionModel.getPromotionById(id);
    if (!existing) {
      return res.status(404).json({ error: "Promotion not found" });
    }
    await promotionModel.deletePromotion(id);
    res.json({ message: "Promotion deleted successfully" });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error deleting promotion" });
  }
}

module.exports = {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
};