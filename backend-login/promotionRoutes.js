const express = require("express");
const promotionController = require("./controllers/promotionController");
const {
  validateCreatePromotion,
} = require("./middleware/promotionValidation");

const router = express.Router();

router.get("/", promotionController.getAllPromotions);
router.post("/", validateCreatePromotion, promotionController.createPromotion);

module.exports = router;
