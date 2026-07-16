const feedbackModel = require("./feedbackModel");

// Get all feedback
async function getAllFeedback(req, res) {
  try {
    const feedback = await feedbackModel.getAllFeedback();
    res.json(feedback);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving feedback" });
  }
}

// Get feedback by ID
async function getFeedbackById(req, res) {
  try {
    const id = parseInt(req.params.id);
    const feedback = await feedbackModel.getFeedbackById(id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }
    res.json(feedback);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving feedback" });
  }
}

// Create new feedback
async function createFeedback(req, res) {
  try {
    const newFeedback = await feedbackModel.createFeedback(req.body);
    res.status(201).json(newFeedback);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error creating feedback" });
  }
}

// Update feedback
async function updateFeedback(req, res) {
  try {
    const id = parseInt(req.params.id);
    const existing = await feedbackModel.getFeedbackById(id);
    if (!existing) {
      return res.status(404).json({ error: "Feedback not found" });
    }
    const updated = await feedbackModel.updateFeedback(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error updating feedback" });
  }
}

// Delete feedback
async function deleteFeedback(req, res) {
  try {
    const id = parseInt(req.params.id);
    const existing = await feedbackModel.getFeedbackById(id);
    if (!existing) {
      return res.status(404).json({ error: "Feedback not found" });
    }
    await feedbackModel.deleteFeedback(id);
    res.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error deleting feedback" });
  }
}

module.exports = {
  getAllFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
};