const express = require("express");
const feedbackController = require("./feedbackController");
const {
  validateFeedback,
  validateUpdateFeedback,
  validateFeedbackId,
} = require("./feedbackValidation");

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/feedback", feedbackController.getAllFeedback);
app.get("/feedback/:id", validateFeedbackId, feedbackController.getFeedbackById);
app.post("/feedback", validateFeedback, feedbackController.createFeedback);
app.put("/feedback/:id", validateFeedbackId, validateUpdateFeedback, feedbackController.updateFeedback);
app.delete("/feedback/:id", validateFeedbackId, feedbackController.deleteFeedback);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});