const express = require("express");
const router = express.Router();

const vendorBadgeController = require("../controllers/vendorBadgeController");

router.get("/:vendorId", vendorBadgeController.getBadgeCounts);


module.exports = router;