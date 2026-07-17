const menuItemModel = require("../models/menuItemModel");

function isVendor(req, res) {
  if (req.role !== "vendor") {
    res.status(403).json({
      message: "Only vendors can manage menu items",
    });
    return false;
  }

  return true;
}

function sendModelError(error, res, fallbackMessage) {
  if (error.code === "INVALID_CUISINE") {
    return res.status(400).json({ message: error.message });
  }

  if (error.code === "STALL_NOT_FOUND") {
    return res.status(404).json({ message: error.message });
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: fallbackMessage });
}

async function getCuisines(req, res) {
  try {
    const cuisines = await menuItemModel.getCuisines();
    res.json(cuisines);
  } catch (error) {
    sendModelError(error, res, "Error retrieving cuisine categories");
  }
}

async function getPublicMenuItems(req, res) {
  const filters = {
    centreId: String(req.query.centreId || "").trim(),
    customerStallId: String(req.query.customerStallId || "").trim(),
    cuisine: String(req.query.cuisine || "").trim(),
  };

  if (filters.centreId.length > 10 || filters.customerStallId.length > 20) {
    return res.status(400).json({ message: "Invalid hawker stall filter" });
  }

  if (filters.cuisine.length > 50) {
    return res.status(400).json({ message: "Invalid cuisine filter" });
  }

  try {
    const menuItems = await menuItemModel.getPublicMenuItems(filters);
    res.json({ menuItems: menuItems });
  } catch (error) {
    sendModelError(error, res, "Error retrieving customer menu items");
  }
}

async function getVendorMenuItems(req, res) {
  if (!isVendor(req, res)) {
    return;
  }

  try {
    const menu = await menuItemModel.getVendorMenuItems(req.userId);
    res.json(menu);
  } catch (error) {
    sendModelError(error, res, "Error retrieving vendor menu items");
  }
}

async function createMenuItem(req, res) {
  if (!isVendor(req, res)) {
    return;
  }

  try {
    const menuItem = await menuItemModel.createMenuItem(req.userId, req.body);
    res.status(201).json({
      message: "Menu item created successfully",
      menuItem: menuItem,
    });
  } catch (error) {
    sendModelError(error, res, "Error creating menu item");
  }
}

async function updateMenuItem(req, res) {
  if (!isVendor(req, res)) {
    return;
  }

  try {
    const menuItem = await menuItemModel.updateMenuItem(
      req.userId,
      req.params.menuItemId,
      req.body
    );

    if (!menuItem) {
      return res.status(404).json({
        message: "Menu item was not found for this vendor",
      });
    }

    res.json({
      message: "Menu item updated successfully",
      menuItem: menuItem,
    });
  } catch (error) {
    sendModelError(error, res, "Error updating menu item");
  }
}

async function deleteMenuItem(req, res) {
  if (!isVendor(req, res)) {
    return;
  }

  try {
    const deleted = await menuItemModel.deleteMenuItem(
      req.userId,
      req.params.menuItemId
    );

    if (!deleted) {
      return res.status(404).json({
        message: "Menu item was not found for this vendor",
      });
    }

    res.json({ message: "Menu item removed successfully" });
  } catch (error) {
    sendModelError(error, res, "Error removing menu item");
  }
}

module.exports = {
  getCuisines,
  getPublicMenuItems,
  getVendorMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
