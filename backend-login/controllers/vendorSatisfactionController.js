const vendorSatisfactionModel = require("../models/vendorSatisfactionModel");

const VALID_CATEGORIES = [
  "Cleanliness",
  "Food Quality",
  "Service Quality",
  "Waiting Time",
  "Others",
];

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

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultDateFilter() {
  const today = new Date();
  const startDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1)
  );

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(today),
    granularity: "month",
  };
}

async function getVendorSatisfaction(req, res) {
  try {
    // The JWT identifies the vendor, so another vendor's stall ID is never accepted.
    if (req.role !== "vendor") {
      return res.status(403).json({
        message: "Only vendors can view the customer satisfaction dashboard",
      });
    }

    const startDate = String(req.query.startDate || "").trim();
    const endDate = String(req.query.endDate || "").trim();
    const category = String(req.query.category || "").trim();
    let dateFilter = getDefaultDateFilter();

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

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: "The complaint category is not valid",
      });
    }

    const dashboard = await vendorSatisfactionModel.getVendorSatisfaction(
      req.userId,
      dateFilter,
      category || null
    );

    if (!dashboard) {
      return res.status(404).json({
        message: "No stall was found for this vendor",
      });
    }

    res.json(dashboard);
  } catch (error) {
    console.error("Controller error in getVendorSatisfaction:", error);
    res.status(500).json({
      message: "Error retrieving customer satisfaction data",
    });
  }
}

module.exports = {
  getVendorSatisfaction,
};
