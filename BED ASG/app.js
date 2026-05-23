const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");

dotenv.config();

const menuItemController = require("./controllers/menuItemController");
const authController = require("./controllers/authController");
const { verifyToken, authorizeRoles } = require("./middlewares/authMiddleware");
const {
  validateMenuItem,
  validateMenuItemId,
  validateMenuItemSearch,
} = require("./middlewares/menuItemValidation");
const {
  validateRegister,
  validateLogin,
} = require("./middlewares/authValidation");

let swaggerDocument = null;
try {
  swaggerDocument = require("./swagger-output.json");
} catch (error) {
  console.warn("Swagger output not found. Run `node swagger.js` to generate it.");
}

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (swaggerDocument) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.get("/", (req, res) => {
  res.json({
    message: "Singapore Hawker Centre Management System API",
    docs: swaggerDocument ? "/api-docs" : "Run node swagger.js, then restart app.js",
  });
});

// Authentication routes
app.post("/auth/register", validateRegister, authController.register);
app.post("/auth/login", validateLogin, authController.login);

// Menu item CRUD routes
app.get("/menu-items", validateMenuItemSearch, menuItemController.getAllMenuItems);
app.get("/menu-items/:id", validateMenuItemId, menuItemController.getMenuItemById);
app.post(
  "/menu-items",
  verifyToken,
  authorizeRoles("vendor", "admin"),
  validateMenuItem,
  menuItemController.createMenuItem
);
app.put(
  "/menu-items/:id",
  verifyToken,
  authorizeRoles("vendor", "admin"),
  validateMenuItemId,
  validateMenuItem,
  menuItemController.updateMenuItem
);
app.delete(
  "/menu-items/:id",
  verifyToken,
  authorizeRoles("vendor", "admin"),
  validateMenuItemId,
  menuItemController.deleteMenuItem
);

// Ignatius - Extra individual feature: patrons can like menu items.
app.post(
  "/menu-items/:id/likes",
  verifyToken,
  authorizeRoles("patron", "admin"),
  validateMenuItemId,
  menuItemController.likeMenuItem
);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ message: "Unexpected server error" });
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  server.close(async () => {
    await sql.close();
    console.log("Database connections closed");
    process.exit(0);
  });
});

module.exports = app;
