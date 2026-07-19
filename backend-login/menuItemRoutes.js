const express = require("express");
const menuItemController = require("./controllers/menuItemController");
const { requireAuth } = require("./middleware/authMiddleware");
const {
  validateCreateMenuItem,
  validateUpdateMenuItem,
} = require("./middleware/menuItemValidation");

const router = express.Router();

// Public customer routes.
router.get("/cuisines", menuItemController.getCuisines);
router.get("/public", menuItemController.getPublicMenuItems);
router.get("/best-sellers", menuItemController.getBestSellingMenuItems);

// Vendor-only menu management routes.
router.get("/vendor", requireAuth, menuItemController.getVendorMenuItems);
router.post(
  "/",
  requireAuth,
  validateCreateMenuItem,
  menuItemController.createMenuItem
);
router.put(
  "/:menuItemId",
  requireAuth,
  validateUpdateMenuItem,
  menuItemController.updateMenuItem
);
router.delete(
  "/:menuItemId",
  requireAuth,
  menuItemController.deleteMenuItem
);

module.exports = router;
