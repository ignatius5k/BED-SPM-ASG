const vendorRentalAgreementModel = require("../models/vendorRentalAgreementModel");
const {
  isValidAgreementId,
  validateAgreementUpdate,
} = require("../utils/rentalAgreementValidation");

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
    if (
      error.code === "CURRENT_AGREEMENT_EXISTS" ||
      error.code === "STALE_AGREEMENT"
    ) {
      return res.status(409).json({ message: error.message });
    }

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
