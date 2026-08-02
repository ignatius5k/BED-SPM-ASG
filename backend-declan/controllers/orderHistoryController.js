const orderHistoryModel = require("../models/orderHistoryModel");

async function getVendorOrderHistory(req, res) {
  try {
    const vendorId = req.params.vendorId;

    const orders = await orderHistoryModel.getVendorOrderHistory(vendorId);

    res.json({
      orders
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Error retrieving order history"
    });
  }
}

async function updateOrderStatus(req, res) {
    try {
        await orderHistoryModel.updateOrderStatus(
            req.params.orderId,
            req.body.status
        );

        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Unable to update order"
        });
    }
}

module.exports = {
  getVendorOrderHistory,
  updateOrderStatus
};