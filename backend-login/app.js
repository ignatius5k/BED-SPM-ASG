const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const userController = require("./controllers/userController");
const { validateRegister, validateLogin } = require("./middleware/userValidation");
const { requireAuth } = require("./middleware/authMiddleware");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// --- User / Auth routes ---
app.post("/users/register", validateRegister, userController.register);
app.post("/users/login", validateLogin, userController.login);
app.put("/users/change-password", requireAuth, userController.changePassword);
app.get("/users", userController.getAllUsers);
app.get("/users/:id", requireAuth, userController.getUserById);
app.put("/users/:id", requireAuth, userController.updateUser);
app.delete("/users/:id", requireAuth, userController.deleteUser);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});


// --- Inspection Routes ---
const inspectionRoutes = require("./inspectionRoutes");
app.use("/inspections",inspectionRoutes);

const stallRoutes = require("./stallRoutes");
app.use("/stalls", stallRoutes);

const scheduleRoutes = require("./scheduleRoutes");
app.use("/schedule", scheduleRoutes);

const inspectorRoutes = require("./inspectorRoutes");
app.use("/inspectors", inspectorRoutes);