const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const userController = require("./controllers/userController");
const { validateRegister, validateLogin } = require("./middleware/userValidation");
const { requireAuth } = require("./middleware/authMiddleware");

// Routes
const inspectionRoutes = require("./inspectionRoutes");
const stallRoutes = require("./stallRoutes");
const scheduleRoutes = require("./scheduleRoutes");
const inspectorRoutes = require("./inspectorRoutes");
const vendorPerformanceRoutes = require("./vendorPerformanceRoutes");
const salesAnalyticsRoutes = require("./salesAnalyticsRoutes");
const menuItemRoutes = require("./menuItemRoutes");
const vendorSatisfactionRoutes = require("./vendorSatisfactionRoutes");

// --- Notifications ---
const notificationRoutes = require("../backend-notifications/routes/notificationRoutes");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 


// --- User / Auth routes ---
app.post("/users/register", validateRegister, userController.register);
app.post("/users/login", validateLogin, userController.login);
app.put("/users/change-password", requireAuth, userController.changePassword);
app.get("/users/me", requireAuth, userController.getCurrentUser);
app.get("/users", userController.getAllUsers);
app.get("/users/:id", requireAuth, userController.getUserById);
app.put("/users/:id", requireAuth, userController.updateUser);
app.delete("/users/:id", requireAuth, userController.deleteUser);

// --- Notifications routes ---
app.use("/notifications", notificationRoutes);

// ---------------- Regulatory Routes ----------------
app.use("/inspections", inspectionRoutes);
app.use("/stalls", stallRoutes);
app.use("/schedule", scheduleRoutes);
app.use("/inspectors", inspectorRoutes);

// ---------------- Other Routes ----------------
app.use("/vendor-performance", vendorPerformanceRoutes);
app.use("/sales-analytics", salesAnalyticsRoutes);
app.use("/menu-items", menuItemRoutes);
app.use("/vendor-satisfaction", vendorSatisfactionRoutes);

// ---------------- Start Server ----------------
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// ---------------- Graceful Shutdown ----------------
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});



module.exports = app;
