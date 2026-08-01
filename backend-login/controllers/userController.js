const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const verificationModel = require("../models/emailVerificationModel");
const { sendVerificationEmail } = require("../services/emailService");

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

// Frontend root, used when redirecting the browser back after a click.
const FRONTEND_URL = process.env.FRONTEND_URL || "http://127.0.0.1:5500";

// Set REQUIRE_EMAIL_VERIFICATION=false in .env to let unverified users log in.
// Handy while other teammates are testing against the same database.
const REQUIRE_VERIFICATION = process.env.REQUIRE_EMAIL_VERIFICATION !== "false";

async function register(req, res) {
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

    // Issue a one-time link and email it through the third-party provider.
    // A failure here must not lose the account that was just created, so the
    // user is told to request a new link instead of seeing a 500.
    let emailSent = true;
    try {
      const rawToken = await verificationModel.createVerification(newUser.id);
      await sendVerificationEmail(email, username, rawToken);
    } catch (emailError) {
      emailSent = false;
      console.error("Verification email failed for", email, emailError);
    }

    res.status(201).json({
      ...newUser,
      emailSent,
      message: emailSent
        ? "Account created. Check your email for the verification link."
        : "Account created, but the verification email could not be sent. Please request a new link."
    });
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

    // Unverified accounts exist but cannot be used yet. The password is
    // checked FIRST so this response cannot be used to discover which
    // email addresses are registered.
    if (REQUIRE_VERIFICATION && !user.IsVerified) {
      return res.status(403).json({
        error: "Please verify your email address before signing in.",
        needsVerification: true
      });
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

/**
 * Landing point for the link inside the email.
 * The browser opens this directly, so it redirects back to the login page
 * with a status flag rather than returning JSON.
 */
async function verifyEmail(req, res) {
  try {
    const token = req.query.token;

    if (!token || typeof token !== "string") {
      return res.redirect(`${FRONTEND_URL}/login.html?verified=invalid`);
    }

    const result = await verificationModel.consumeVerification(token);
    return res.redirect(`${FRONTEND_URL}/login.html?verified=${result.status}`);
  } catch (error) {
    console.error("Controller error in verifyEmail:", error);
    return res.redirect(`${FRONTEND_URL}/login.html?verified=error`);
  }
}

/**
 * Sends a fresh link if the first one expired or never arrived.
 * The response is deliberately the same whether or not the email exists,
 * so this endpoint cannot be used to check who has an account.
 */
async function resendVerification(req, res) {
  const genericResponse = {
    message: "If that email needs verification, a new link has been sent."
  };

  try {
    const { email } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: "A valid email address is required" });
    }

    const user = await userModel.getUserByEmail(email);
    if (!user || user.IsVerified) {
      return res.json(genericResponse);
    }

    const rawToken = await verificationModel.createVerification(user.id);
    await sendVerificationEmail(user.email, user.username, rawToken);

    res.json(genericResponse);
  } catch (error) {
    console.error("Controller error in resendVerification:", error);
    res.status(500).json({ error: "Error sending verification email" });
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
  verifyEmail,
  resendVerification,
  changePassword,
  getAllUsers,
  getCurrentUser,
  getUserById,
  updateUser,
  deleteUser
};