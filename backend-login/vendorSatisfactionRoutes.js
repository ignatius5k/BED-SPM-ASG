const express = require("express");
const vendorSatisfactionController = require("./controllers/vendorSatisfactionController");
const { requireAuth } = require("./middleware/authMiddleware");

const router = express.Router();

// GET /vendor-satisfaction
// The logged-in vendor ID is read from the verified JWT.
router.get(
  "/",
  requireAuth,
  vendorSatisfactionController.getVendorSatisfaction
);

module.exports = router;
