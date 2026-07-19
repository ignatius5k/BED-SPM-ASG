const express = require("express");
const salesAnalyticsController = require("./controllers/salesAnalyticsController");

const router = express.Router();

// GET /sales-analytics
// This route is public because the home page is available to guest customers.
router.get("/", salesAnalyticsController.getSalesAnalytics);

module.exports = router;
