const notificationModel = require("../models/notificationModel");

async function getNotifications(req, res) {
    try {
        const notifications = await notificationModel.getByVendor(req.params.vendorId);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: "Unable to retrieve notifications" });
    }
}

async function markAsRead(req, res) {
    try {
        await notificationModel.markAsRead(req.params.id);
        res.json({ message: "Notification marked as read" });
    } catch (err) {
        res.status(500).json({ error: "Unable to update notification" });
    }
}

async function deleteNotification(req, res) {
    try {
        await notificationModel.deleteNotification(req.params.id);
        res.json({ message: "Notification deleted" });
    } catch (err) {
        res.status(500).json({ error: "Unable to delete notification" });
    }
}

async function createNotification(req, res) {
    try {
        const notification = await notificationModel.createNotification(req.body);
        res.json(notification);
    } catch(err) {
        console.error(err);
        res.status(500).json({
            error:"Failed to create notification"
        });
    }
}

module.exports = {
    getNotifications,
    markAsRead,
    deleteNotification,
    createNotification
};