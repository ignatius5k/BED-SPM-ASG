const vendorPerformanceModel = require("../models/vendorPerformanceModel");

function isValidDate(dateValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return false;
  }

  const date = new Date(`${dateValue}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === dateValue
  );
}

async function getVendorPerformance(req, res) {
  try {
    // Only a logged-in vendor should see their own performance data.
    if (req.role !== "vendor") {
      return res.status(403).json({
        message: "Only vendors can view the stall performance dashboard",
      });
    }

    const startDate = String(req.query.startDate || "").trim();
    const endDate = String(req.query.endDate || "").trim();
    let dateFilter = null;

    if (startDate || endDate) {
      if (!startDate || !endDate) {
        return res.status(400).json({
          message: "Both startDate and endDate are required",
        });
      }

      if (!isValidDate(startDate) || !isValidDate(endDate)) {
        return res.status(400).json({
          message: "Dates must use the YYYY-MM-DD format",
        });
      }

      if (startDate > endDate) {
        return res.status(400).json({
          message: "The start date must be before the end date",
        });
      }

      const startDateValue = new Date(`${startDate}T00:00:00Z`);
      const endDateValue = new Date(`${endDate}T00:00:00Z`);
      const rangeInDays =
        Math.floor((endDateValue - startDateValue) / 86400000) + 1;

      dateFilter = {
        startDate: startDate,
        endDate: endDate,
        granularity: rangeInDays <= 31 ? "week" : "month",
      };
    }

    const performance = await vendorPerformanceModel.getVendorPerformance(
      req.userId,
      dateFilter
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
