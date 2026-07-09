const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const userController = require("./controllers/userController");
const { validateRegister, validateLogin } = require("./middlewares/userValidation");
const { requireAuth } = require("./middlewares/authMiddleware");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // frontend runs on a different origin/port, so this is needed
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- User / Auth routes ---
app.post("/users/register", validateRegister, userController.register);
app.post("/users/login", validateLogin, userController.login);
app.put("/users/change-password", requireAuth, userController.changePassword);


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});