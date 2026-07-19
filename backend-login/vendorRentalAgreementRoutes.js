const express = require("express");
const vendorRentalAgreementController = require("./controllers/vendorRentalAgreementController");
const { requireAuth } = require("./middleware/authMiddleware");

const router = express.Router();

// The verified JWT supplies the vendor ID for both routes.
router.get(
  "/",
  requireAuth,
  vendorRentalAgreementController.getVendorRentalAgreements
);

router.put(
  "/:agreementId",
  requireAuth,
  vendorRentalAgreementController.updateVendorRentalAgreement
);

module.exports = router;
