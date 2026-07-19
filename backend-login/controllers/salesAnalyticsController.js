const salesAnalyticsModel = require("../models/salesAnalyticsModel");

async function getSalesAnalytics(req, res) {
  try {
    const analytics = await salesAnalyticsModel.getSalesAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error("Controller error in getSalesAnalytics:", error);
    res.status(500).json({
      message: "Error retrieving sales analytics data",
    });
  }
}

module.exports = {
  getSalesAnalytics,
};
