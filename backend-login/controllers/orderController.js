const orderModel = require("../models/orderModel");

async function createOrder(req, res) {
  try {
    // Input already checked by the validateCreateOrder middleware,
    // so the controller can focus on the actual work.
    const { stallId, items } = req.body;

    // req.userId comes from the verified token, not the request body,
    // so an order is always linked to whoever is actually signed in.
    const order = await orderModel.createOrder(req.userId, stallId, items);
    res.status(201).json(order);
  } catch (error) {
    console.error("Controller error in createOrder:", error);
    res.status(500).json({ error: error.message || "Error creating order" });
  }
}

async function getMyOrders(req, res) {
  try {
    const orders = await orderModel.getOrdersByCustomer(req.userId);
    res.json(orders);
  } catch (error) {
    console.error("Controller error in getMyOrders:", error);
    res.status(500).json({ error: "Error retrieving orders" });
  }
}

async function searchOrders(req, res) {
  try {
    const searchTerm = req.query.searchTerm;

    if (!searchTerm) {
      return res.status(400).json({ error: "Search term is required" });
    }

    // Scoped to req.userId so a customer can only search their own orders.
    const orders = await orderModel.searchOrders(req.userId, searchTerm);
    res.json(orders);
  } catch (error) {
    console.error("Controller error in searchOrders:", error);
    res.status(500).json({ error: "Error searching orders" });
  }
}

async function getOrderById(req, res) {
  try {
    const order = await orderModel.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Ownership check: a customer cannot view someone else's order
    // even if they guess a valid order ID.
    if (order.CustomerID !== req.userId) {
      return res.status(403).json({ error: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    console.error("Controller error in getOrderById:", error);
    res.status(500).json({ error: "Error retrieving order" });
  }
}

module.exports = { createOrder, getMyOrders, getOrderById, searchOrders };