const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");

//todo: add requireAuth middleware for security if needed

// Get all notifications for a vendor
router.get("/:vendorId", notificationController.getNotifications);

// Mark a notification as read
router.put("/:id/read", notificationController.markAsRead);

// Delete a notification
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;