const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const userController = require("./controllers/userController");
const orderController = require("./controllers/orderController");
const { validateRegister, validateLogin, validateChangePassword } = require("./middleware/userValidation");
const { requireAuth, requireRole } = require("./middleware/authMiddleware");
const { validateCreateOrder, validateOrderId } = require("./middleware/orderValidation");

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
const inspectorRentalAgreementRoutes = require("./inspectorRentalAgreementRoutes");
const vendorInspectionHistoryRoutes = require("./vendorInspectionHistoryRoutes");
const feedbackRoutes = require("./feedbackRoutes");
const complaintRoutes = require("./complaintRoutes");
const promotionRoutes = require("./promotionRoutes")

// --- Declan routes ---
const notificationRoutes = require("../backend-declan/routes/notificationRoutes");
const orderHistoryRoutes = require("../backend-declan/routes/orderHistoryRoutes");
const vendorComplaintRoutes = require("../backend-declan/routes/vendorComplaintRoutes");
const vendorBadgeRoutes = require("../backend-declan/routes/vendorBadgeRoutes");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Interactive API documentation generated from backend-login/docs/*.js.
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));


// --- User / Auth routes ---
app.post("/users/register", validateRegister, userController.register);
app.post("/users/login", validateLogin, userController.login);

// Email verification (third-party email API)
app.get("/users/verify-email", userController.verifyEmail);
app.post("/users/resend-verification", userController.resendVerification);

app.put("/users/change-password", requireAuth, validateChangePassword, userController.changePassword);
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
app.use("/inspection-rental-agreements", inspectorRentalAgreementRoutes);
app.use("/vendor-inspection-history", vendorInspectionHistoryRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/complaint", complaintRoutes);
app.use("/promotion", promotionRoutes);

// --- Order History routes ---
app.post("/orders", requireAuth, requireRole("customer"), validateCreateOrder, orderController.createOrder);
app.get("/orders", requireAuth, orderController.getMyOrders);
app.get("/orders/search", requireAuth, orderController.searchOrders);
app.get("/orders/:id", requireAuth, validateOrderId, orderController.getOrderById);

// --- Declan routes ---
app.use("/notifications", notificationRoutes);
app.use("/orderHistory", orderHistoryRoutes); // this is for vendor side order history
app.use("/vendorComplaints", vendorComplaintRoutes);
app.use("/vendorBadges", vendorBadgeRoutes);

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
