const feedbackModel = require("../models/feedbackModel");

async function getFeedback(req, res) {
  try {
    const result = await feedbackModel.getFeedbackForStall(
      req.validatedFeedbackQuery.centreId,
      req.validatedFeedbackQuery.customerStallId,
      req.userId || null
    );

    if (!result) {
      return res.status(404).json({
        error: "The selected stall was not found in SQL",
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Controller error in getFeedback:", error);
    res.status(500).json({ error: "Error retrieving reviews" });
  }
}

async function createFeedback(req, res) {
  try {
    const feedback = await feedbackModel.createFeedback(req.userId, req.body);

    if (!feedback) {
      return res.status(404).json({
        error: "The selected stall was not found in SQL",
      });
    }

    res.status(201).json(feedback);
  } catch (error) {
    console.error("Controller error in createFeedback:", error);
    res.status(500).json({ error: "Error creating review" });
  }
}

async function updateFeedback(req, res) {
  try {
    const feedback = await feedbackModel.updateFeedback(
      req.userId,
      req.feedbackId,
      req.body
    );

    if (!feedback) {
      return res.status(404).json({
        error: "Review not found or you do not own it",
      });
    }

    res.json(feedback);
  } catch (error) {
    console.error("Controller error in updateFeedback:", error);
    res.status(500).json({ error: "Error updating review" });
  }
}

async function deleteFeedback(req, res) {
  try {
    const deleted = await feedbackModel.deleteFeedback(
      req.userId,
      req.feedbackId
    );

    if (!deleted) {
      return res.status(404).json({
        error: "Review not found or you do not own it",
      });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Controller error in deleteFeedback:", error);
    res.status(500).json({ error: "Error deleting review" });
  }
}

module.exports = {
  getFeedback,
  createFeedback,
  updateFeedback,
  deleteFeedback,
};
