const express = require("express");
const feedbackController = require("./controllers/feedbackController");
const {
  requireAuth,
  optionalAuth,
  requireRole,
} = require("./middleware/authMiddleware");
const {
  validateFeedbackQuery,
  validateCreateFeedback,
  validateUpdateFeedback,
  validateFeedbackId,
} = require("./middleware/feedbackValidation");

const router = express.Router();

router.get(
  "/",
  optionalAuth,
  validateFeedbackQuery,
  feedbackController.getFeedback
);

router.post(
  "/",
  requireAuth,
  requireRole("customer"),
  validateCreateFeedback,
  feedbackController.createFeedback
);

router.put(
  "/:feedbackId",
  requireAuth,
  requireRole("customer"),
  validateFeedbackId,
  validateUpdateFeedback,
  feedbackController.updateFeedback
);

router.delete(
  "/:feedbackId",
  requireAuth,
  requireRole("customer"),
  validateFeedbackId,
  feedbackController.deleteFeedback
);

module.exports = router;
