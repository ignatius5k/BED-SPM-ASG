const orderModel = require("../models/orderModel");

async function createOrder(req, res) {
  try {
    const { stallId, items } = req.body;
    if (!stallId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "stallId and at least one item are required" });
    }
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

async function getOrderById(req, res) {
  try {
    const order = await orderModel.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.CustomerID !== req.userId) {
      return res.status(403).json({ error: "Not authorized to view this order" });
    }
    res.json(order);
  } catch (error) {
    console.error("Controller error in getOrderById:", error);
    res.status(500).json({ error: "Error retrieving order" });
  }
}

module.exports = { createOrder, getMyOrders, getOrderById };