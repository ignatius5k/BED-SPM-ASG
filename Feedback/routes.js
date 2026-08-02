const express = require("express");
const router = express.Router();

const feedbackController = require("./feedbackController");
const {
    validateFeedback,
    validateUpdateFeedback,
    validateFeedbackId,
} = require("./feedbackValidation");

const complaintController = require("./complaintController");
const {
    validateComplaint,
    validateUpdateComplaint,
    validateComplaintId,
} = require("./complaintValidation");

const promotionController = require("./promotionsController");
const {
    validatePromotion,
    validateUpdatePromotion,
    validatePromotionId,
} = require("./promotionsValidation");


// Feedback
router.get("/", feedbackController.getAllFeedback);
router.get("/:id", validateFeedbackId, feedbackController.getFeedbackById);
router.post("/", validateFeedback, feedbackController.createFeedback);
router.put("/:id", validateFeedbackId, validateUpdateFeedback, feedbackController.updateFeedback);
router.delete("/:id", validateFeedbackId, feedbackController.deleteFeedback);


// Complaints
router.get("/complaints", complaintController.getAllComplaints);
router.get("/complaints/:id", validateComplaintId, complaintController.getComplaintById);
router.post("/complaints", validateComplaint, complaintController.createComplaint);
router.put("/complaints/:id", validateComplaintId, validateUpdateComplaint, complaintController.updateComplaint);
router.delete("/complaints/:id", validateComplaintId, complaintController.deleteComplaint);


// Promotions
router.get("/promotions", promotionController.getAllPromotions);
router.get("/promotions/:id", validatePromotionId, promotionController.getPromotionById);
router.post("/promotions", validatePromotion, promotionController.createPromotion);
router.put("/promotions/:id", validatePromotionId, validateUpdatePromotion, promotionController.updatePromotion);
router.delete("/promotions/:id", validatePromotionId, promotionController.deletePromotion);


module.exports = router;