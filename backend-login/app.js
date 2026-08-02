const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const userController = require("./controllers/userController");
const orderController = require("./controllers/orderController");
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
const vendorRentalAgreementRoutes = require("./vendorRentalAgreementRoutes");
const vendorInspectionHistoryRoutes = require("./vendorInspectionHistoryRoutes");
const feedbackRoutes = require("./feedbackRoutes");
const promotionRoutes = require("./promotionRoutes")

// --- Notifications ---
const notificationRoutes = require("../backend-declan/routes/notificationRoutes");

// --- Vendor Complaint Display ---
const vendorComplaintRoutes = require("../backend-declan/routes/vendorComplaintRoutes");
const vendorBadgeRoutes = require("../backend-declan/routes/vendorBadgeRoutes");

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

// --- Feature routes ---
app.use("/inspections", inspectionRoutes);
app.use("/stalls", stallRoutes);
app.use("/schedule", scheduleRoutes);
app.use("/inspectors", inspectorRoutes);
app.use("/vendor-performance", vendorPerformanceRoutes);
app.use("/sales-analytics", salesAnalyticsRoutes);
app.use("/menu-items", menuItemRoutes);
app.use("/vendor-satisfaction", vendorSatisfactionRoutes);
app.use("/vendor-rental-agreements", vendorRentalAgreementRoutes);
app.use("/vendor-inspection-history", vendorInspectionHistoryRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/promotion", promotionRoutes);

// --- Order History routes ---
app.post("/orders", requireAuth, orderController.createOrder);
app.get("/orders", requireAuth, orderController.getMyOrders);
app.get("/orders/:id", requireAuth, orderController.getOrderById);

// --- Notifications routes ---
app.use("/notifications", notificationRoutes);

// --- Vendor Complaint Display routes ---
app.use("/vendorComplaints", vendorComplaintRoutes);
app.use("/vendorBadges", vendorBadgeRoutes);

// Start only when this file is run directly. Tests can import the app safely.
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// ---------------- Graceful Shutdown ----------------
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});

module.exports = app;
