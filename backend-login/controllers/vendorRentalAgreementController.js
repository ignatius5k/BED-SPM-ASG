const vendorRentalAgreementModel = require("../models/vendorRentalAgreementModel");

const VALID_STATUSES = ["active", "renewal due", "renewed", "expired"];
const MAX_MONTHLY_RENT = 99999999.99;

function isValidAgreementId(agreementId) {
  return /^[A-Za-z0-9-]{1,10}$/.test(String(agreementId || "").trim());
}

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

function validateAgreementUpdate(body) {
  const startDate = String(body.startDate || "").trim();
  const endDate = String(body.endDate || "").trim();
  const renewalDate = String(body.renewalDate || "").trim();
  const status = String(body.status || "").trim().toLowerCase();
  const termsSummary = String(body.termsSummary || "").trim();
  const changeReason = String(body.changeReason || "").trim();
  const monthlyRent = Number(body.monthlyRent);

  if (!isValidDate(startDate) || !isValidDate(endDate) || !isValidDate(renewalDate)) {
    return { error: "Dates must use the YYYY-MM-DD format" };
  }

  if (startDate > endDate) {
    return { error: "The rental start date must be before the end date" };
  }

  if (renewalDate < startDate || renewalDate > endDate) {
    return { error: "The renewal date must fall within the rental period" };
  }

  if (
    !Number.isFinite(monthlyRent) ||
    monthlyRent < 0 ||
    monthlyRent > MAX_MONTHLY_RENT
  ) {
    return { error: "Monthly rent must be between 0 and 99,999,999.99" };
  }

  if (!VALID_STATUSES.includes(status)) {
    return { error: "The agreement status is not valid" };
  }

  if (termsSummary.length > 500) {
    return { error: "The terms summary must be 500 characters or fewer" };
  }

  if (changeReason.length < 3 || changeReason.length > 250) {
    return { error: "A change reason between 3 and 250 characters is required" };
  }

  return {
    value: {
      startDate,
      endDate,
      monthlyRent,
      renewalDate,
      status,
      termsSummary,
      changeReason,
    },
  };
}

async function getVendorRentalAgreements(req, res) {
  try {
    if (req.role !== "vendor") {
      return res.status(403).json({
        message: "Only vendors can view rental agreements",
      });
    }

    const dashboard = await vendorRentalAgreementModel.getVendorRentalAgreements(
      req.userId
    );

    if (!dashboard) {
      return res.status(404).json({
        message: "No stall was found for this vendor",
      });
    }

    res.json(dashboard);
  } catch (error) {
    console.error("Controller error in getVendorRentalAgreements:", error);
    res.status(500).json({
      message: "Error retrieving rental agreements",
    });
  }
}

async function updateVendorRentalAgreement(req, res) {
  try {
    if (req.role !== "vendor") {
      return res.status(403).json({
        message: "Only vendors can update rental agreements",
      });
    }

    if (!isValidAgreementId(req.params.agreementId)) {
      return res.status(400).json({
        message: "The agreement ID is not valid",
      });
    }

    const validation = validateAgreementUpdate(req.body);

    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const result = await vendorRentalAgreementModel.updateVendorRentalAgreement(
      req.userId,
      req.params.agreementId,
      validation.value
    );

    if (!result) {
      return res.status(404).json({
        message: "The rental agreement was not found for this vendor",
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Controller error in updateVendorRentalAgreement:", error);
    res.status(500).json({
      message: "Error updating the rental agreement",
    });
  }
}

module.exports = {
  getVendorRentalAgreements,
  updateVendorRentalAgreement,
};
