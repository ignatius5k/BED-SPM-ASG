const vendorInspectionHistoryModel = require("../models/vendorInspectionHistoryModel");

const VALID_PERIODS = [0, 3, 6, 12];

async function getVendorInspectionHistory(req, res) {
  try {
    if (req.role !== "vendor") {
      return res.status(403).json({
        message: "Only vendors can view stall inspection history",
      });
    }

    const monthsText = String(req.query.months || "12").trim();
    const months = Number(monthsText);
    const stallId = String(req.query.stallId || "").trim();

    if (!Number.isInteger(months) || !VALID_PERIODS.includes(months)) {
      return res.status(400).json({
        message: "The inspection period must be 3, 6, 12, or 0 for all history",
      });
    }

    if (stallId.length > 10) {
      return res.status(400).json({
        message: "The stall ID is not valid",
      });
    }

    const dashboard = await vendorInspectionHistoryModel.getVendorInspectionHistory(
      req.userId,
      months,
      stallId || null
    );

    if (!dashboard) {
      return res.status(404).json({
        message: "No stall was found for this vendor",
      });
    }

    if (dashboard.invalidStall) {
      return res.status(404).json({
        message: "The selected stall does not belong to this vendor",
      });
    }

    res.json(dashboard);
  } catch (error) {
    console.error("Controller error in getVendorInspectionHistory:", error);
    res.status(500).json({
      message: "Error retrieving inspection history",
    });
  }
}

module.exports = {
  getVendorInspectionHistory,
};
