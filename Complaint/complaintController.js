const complaintModel = require("./complaintModel");

// Get all complaints
async function getAllComplaints(req, res) {
  try {
    const complaints = await complaintModel.getAllComplaints();
    res.json(complaints);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving complaints" });
  }
}

// Get complaint by ID
async function getComplaintById(req, res) {
  try {
    const id = parseInt(req.params.id);
    const complaint = await complaintModel.getComplaintById(id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    res.json(complaint);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving complaint" });
  }
}

// Create new complaint
async function createComplaint(req, res) {
  try {
    const newComplaint = await complaintModel.createComplaint(req.body);
    res.status(201).json(newComplaint);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error creating complaint" });
  }
}

// Update complaint
async function updateComplaint(req, res) {
  try {
    const id = parseInt(req.params.id);
    const existing = await complaintModel.getComplaintById(id);
    if (!existing) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    const updated = await complaintModel.updateComplaint(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error updating complaint" });
  }
}

// Delete complaint
async function deleteComplaint(req, res) {
  try {
    const id = parseInt(req.params.id);
    const existing = await complaintModel.getComplaintById(id);
    if (!existing) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    await complaintModel.deleteComplaint(id);
    res.json({ message: "Complaint deleted successfully" });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error deleting complaint" });
  }
}

module.exports = {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
};