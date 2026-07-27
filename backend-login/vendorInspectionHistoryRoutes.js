const express = require("express");
const vendorInspectionHistoryController = require("./controllers/vendorInspectionHistoryController");
const { requireAuth } = require("./middleware/authMiddleware");

const router = express.Router();

// GET /vendor-inspection-history
// The verified JWT supplies the vendor ID. The route is read-only because
// inspection results should only be changed by an inspector.
router.get(
  "/",
  requireAuth,
  vendorInspectionHistoryController.getVendorInspectionHistory
);

module.exports = router;
