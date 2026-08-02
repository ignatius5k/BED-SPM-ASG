const express = require("express");
const complaintController = require("./controllers/complaintController");
const {
  requireAuth,
  requireRole,
} = require("./middleware/authMiddleware");
const {
  validateCreateComplaint,
} = require("./middleware/complaintValidation");

const router = express.Router();

router.post(
  "/",
  requireAuth,
  requireRole("customer"),
  validateCreateComplaint,
  complaintController.createComplaint
);

module.exports = router;
