const express = require("express");
const inspectorRentalAgreementController = require("./controllers/inspectorRentalAgreementController");
const { requireAuth } = require("./middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  inspectorRentalAgreementController.getInspectorRentalAgreements
);

router.post(
  "/",
  requireAuth,
  inspectorRentalAgreementController.createInspectorRentalAgreement
);

router.put(
  "/:agreementId",
  requireAuth,
  inspectorRentalAgreementController.updateInspectorRentalAgreement
);

module.exports = router;
