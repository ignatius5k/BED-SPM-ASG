const vendorPerformanceModel = require("../models/vendorPerformanceModel");

async function getVendorPerformance(req, res) {
  try {
    // Only a logged-in vendor should see their own performance data.
    if (req.role !== "vendor") {
      return res.status(403).json({
        message: "Only vendors can view the stall performance dashboard",
      });
    }

    const performance = await vendorPerformanceModel.getVendorPerformance(
      req.userId
    );

    if (!performance) {
      return res.status(404).json({
        message: "No stall was found for this vendor",
      });
    }

    res.json(performance);
  } catch (error) {
    console.error("Controller error in getVendorPerformance:", error);
    res.status(500).json({
      message: "Error retrieving stall performance data",
    });
  }
}

module.exports = {
  getVendorPerformance,
};
