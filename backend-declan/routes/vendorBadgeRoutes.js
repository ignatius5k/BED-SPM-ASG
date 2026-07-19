const express = require("express");
const router = express.Router();

const controller =
require("../controllers/vendorBadgeController");


router.get(
"/:vendorId",
controller.getBadgeCounts
);


module.exports = router;