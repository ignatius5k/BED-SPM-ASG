const express = require("express");
const router = express.Router();

const orderHistoryController = require("../controllers/orderHistoryController");

//todo: add requireAuth middleware for security if needed

// Get all orders for a vendor
router.get("/:vendorId", orderHistoryController.getVendorOrderHistory);

router.put("/:orderId", orderHistoryController.updateOrderStatus);

module.exports = router;