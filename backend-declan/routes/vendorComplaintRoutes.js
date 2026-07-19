const express = require("express");

const router = express.Router();

const complaintController =
    require("../controllers/vendorComplaintController");


router.get(
    "/:vendorId",
    complaintController.getVendorComplaints
);

router.put(
    "/:id",
    complaintController.updateComplaintStatus
);

module.exports = router;