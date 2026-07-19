const express = require("express");
const vendorPerformanceController = require("./controllers/vendorPerformanceController");
const { requireAuth } = require("./middleware/authMiddleware");

const router = express.Router();

// GET /vendor-performance
// The JWT supplies the vendor ID, so vendors cannot request another vendor's data.
router.get(
  "/",
  requireAuth,
  vendorPerformanceController.getVendorPerformance
);

module.exports = router;
