const express = require("express");
const cors = require("cors");
require("dotenv").config();

// feedback
const feedbackController = require("./feedbackController");
const {
  validateFeedback,
  validateUpdateFeedback,
  validateFeedbackId,
} = require("./feedbackValidation");

// complaint
const complaintController = require("./complaintController");
const {
  validateComplaint,
  validateUpdateComplaint,
  validateComplaintId,
} = require("./complaintValidation");

// Promotions 
const promotionController = require("./promotionsController");
const {
  validatePromotion,
  validateUpdatePromotion,
  validatePromotionId,
} = require("./promotionsValidation");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Feedback routes ----
app.get("/feedback", feedbackController.getAllFeedback);
app.get("/feedback/:id", validateFeedbackId, feedbackController.getFeedbackById);
app.post("/feedback", validateFeedback, feedbackController.createFeedback);
app.put("/feedback/:id", validateFeedbackId, validateUpdateFeedback, feedbackController.updateFeedback);
app.delete("/feedback/:id", validateFeedbackId, feedbackController.deleteFeedback);

// ---- Complaint routes ----
app.get("/complaint", complaintController.getAllComplaints);
app.get("/complaint/:id", validateComplaintId, complaintController.getComplaintById);
app.post("/complaint", validateComplaint, complaintController.createComplaint);
app.put("/complaint/:id", validateComplaintId, validateUpdateComplaint, complaintController.updateComplaint);
app.delete("/complaint/:id", validateComplaintId, complaintController.deleteComplaint);

// ---- Promotion routes ----
app.get("/promotion", promotionController.getAllPromotions);
app.get("/promotion/:id", validatePromotionId, promotionController.getPromotionById);
app.post("/promotion", validatePromotion, promotionController.createPromotion);
app.put("/promotion/:id", validatePromotionId, validateUpdatePromotion, promotionController.updatePromotion);
app.delete("/promotion/:id", validatePromotionId, promotionController.deletePromotion);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});