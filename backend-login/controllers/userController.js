 
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

async function register(req, res) {
    console.log("REGISTER BODY:", req.body);

    try {
        const { username, email, password, role, badgeNumber, department } = req.body;
    const existing = await userModel.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Never store the raw password - only the bcrypt hash.
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await userModel.createUser({
      username, email, password: hashedPassword, role, badgeNumber, department
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Controller error in register:", error);
    res.status(500).json({ error: "Error registering user" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Compare the submitted plain password against the stored hash.
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // JWT STEP 1: "Stamp the ID card."
    // Payload = who this token represents (id, role, email).
    // JWT_SECRET = the stamp only this server knows - proves the card is genuine.
    // expiresIn = card auto-invalidates after 7 days, forcing re-login.
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send the card back to the browser. api.js stores it in localStorage.
    res.json({ token, id: user.id, username: user.username, role: user.role });
  } catch (error) {
    console.error("Controller error in login:", error);
    res.status(500).json({ error: "Error logging in" });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;       // set by requireAuth from the verified token
    const userEmail = req.userEmail; // set by requireAuth from the verified token

    const user = await userModel.getUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check the current password against the stored hash.
    // Without this, anyone holding a token could change the password
    // without knowing the existing one.
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Reject reusing the same password
    const sameAsOld = await bcrypt.compare(newPassword, user.password);
    if (sameAsOld) {
      return res.status(400).json({
        error: "New password must be different from your current password"
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(userId, newHash);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Controller error in changePassword:", error);
    res.status(500).json({ error: "Error changing password" });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await userModel.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Controller error in getAllUsers:", error);
    res.status(500).json({ error: "Error retrieving users" });
  }
}

// Return the user from the verified JWT instead of trusting an ID from the browser.
async function getCurrentUser(req, res) {
  try {
    const user = await userModel.getUserById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Controller error in getCurrentUser:", error);
    res.status(500).json({ error: "Error retrieving current user" });
  }
}

async function getUserById(req, res) {
  try {
    const user = await userModel.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Controller error in getUserById:", error);
    res.status(500).json({ error: "Error retrieving user" });
  }
}

async function updateUser(req, res) {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: "username and email are required" });
    }
    const updated = await userModel.updateUser(req.params.id, { username, email });
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error("Controller error in updateUser:", error);
    res.status(500).json({ error: "Error updating user" });
  }
}

async function deleteUser(req, res) {
  try {
    const deleted = await userModel.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully", user: deleted });
  } catch (error) {
    console.error("Controller error in deleteUser:", error);
    res.status(500).json({ error: "Error deleting user" });
  }
}

module.exports = {
  register,
  login,
  changePassword,
  getAllUsers,
  getCurrentUser,
  getUserById,
  updateUser,
  deleteUser
};
