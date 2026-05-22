const menuItemModel = require("../models/menuItemModel");

async function getAllMenuItems(req, res) {
  try {
    const filters = {
      stallId: req.query.stallId ? parseInt(req.query.stallId, 10) : null,
      category: req.query.category || null,
      searchTerm: req.query.searchTerm || null,
      availableOnly: req.query.availableOnly === "true",
    };

    const menuItems = await menuItemModel.getAllMenuItems(filters);
    res.json(menuItems);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ message: "Error retrieving menu items" });
  }
}

async function getMenuItemById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const menuItem = await menuItemModel.getMenuItemById(id);

    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json(menuItem);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ message: "Error retrieving menu item" });
  }
}

async function createMenuItem(req, res) {
  try {
    const newMenuItem = await menuItemModel.createMenuItem(req.body);
    res.status(201).json(newMenuItem);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ message: "Error creating menu item" });
  }
}

async function updateMenuItem(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const updatedMenuItem = await menuItemModel.updateMenuItem(id, req.body);

    if (!updatedMenuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json(updatedMenuItem);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ message: "Error updating menu item" });
  }
}

async function deleteMenuItem(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const wasDeleted = await menuItemModel.deleteMenuItem(id);

    if (!wasDeleted) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ message: "Error deleting menu item" });
  }
}

async function likeMenuItem(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const updatedMenuItem = await menuItemModel.likeMenuItem(id, req.user.id);

    if (!updatedMenuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json(updatedMenuItem);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ message: "Error liking menu item" });
  }
}

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  likeMenuItem,
};
