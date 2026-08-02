const complaintModel = require("../models/complaintModel");

async function createComplaint(req, res) {
  try {
    const complaint = await complaintModel.createComplaint(
      req.userId,
      req.body
    );

    if (!complaint) {
      return res.status(404).json({
        error: "The selected stall was not found in SQL",
      });
    }

    res.status(201).json(complaint);
  } catch (error) {
    console.error("Controller error in createComplaint:", error);
    res.status(500).json({ error: "Error creating complaint" });
  }
}

module.exports = {
  createComplaint,
};
