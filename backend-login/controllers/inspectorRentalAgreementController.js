const inspectorRentalAgreementModel = require("../models/inspectorRentalAgreementModel");
const {
  isValidAgreementId,
  validateAgreementCreation,
  validateAgreementUpdate,
} = require("../utils/rentalAgreementValidation");

function requireInspectorRole(req, res) {
  if (req.role !== "inspector") {
    res.status(403).json({
      message: "Only inspectors can manage government rental agreements",
    });
    return false;
  }

  return true;
}

function sendModelError(error, res) {
  if (error.code === "STALL_NOT_FOUND") {
    res.status(404).json({ message: error.message });
    return true;
  }

  if (
    error.code === "AGREEMENT_REFERENCE_EXISTS" ||
    error.code === "CURRENT_AGREEMENT_EXISTS" ||
    error.code === "AGREEMENT_ID_LIMIT_REACHED"
  ) {
    res.status(409).json({ message: error.message });
    return true;
  }

  return false;
}

async function getInspectorRentalAgreements(req, res) {
  try {
    if (!requireInspectorRole(req, res)) {
      return;
    }

    const dashboard = await inspectorRentalAgreementModel.getInspectorRentalAgreements();
    res.json(dashboard);
  } catch (error) {
    console.error("Controller error in getInspectorRentalAgreements:", error);
    res.status(500).json({
      message: "Error retrieving inspector rental agreements",
    });
  }
}

async function createInspectorRentalAgreement(req, res) {
  try {
    if (!requireInspectorRole(req, res)) {
      return;
    }

    const validation = validateAgreementCreation(req.body);

    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const agreement = await inspectorRentalAgreementModel.createInspectorRentalAgreement(
      req.userId,
      validation.value
    );

    res.status(201).json({ agreement });
  } catch (error) {
    if (sendModelError(error, res)) {
      return;
    }

    console.error("Controller error in createInspectorRentalAgreement:", error);
    res.status(500).json({
      message: "Error creating the rental agreement",
    });
  }
}

async function updateInspectorRentalAgreement(req, res) {
  try {
    if (!requireInspectorRole(req, res)) {
      return;
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

    const result = await inspectorRentalAgreementModel.updateInspectorRentalAgreement(
      req.userId,
      req.params.agreementId,
      validation.value
    );

    if (!result) {
      return res.status(404).json({
        message: "The rental agreement was not found",
      });
    }

    res.json(result);
  } catch (error) {
    if (sendModelError(error, res)) {
      return;
    }

    console.error("Controller error in updateInspectorRentalAgreement:", error);
    res.status(500).json({
      message: "Error updating the rental agreement",
    });
  }
}

module.exports = {
  getInspectorRentalAgreements,
  createInspectorRentalAgreement,
  updateInspectorRentalAgreement,
};
