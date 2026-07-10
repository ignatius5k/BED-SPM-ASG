const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

const JWT_SECRET = "replace_with_a_long_random_secret";

async function register(req, res) {
  try {
    const { username, email, password, role, badgeNumber, department } = req.body;

    const existing = await userModel.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

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

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, id: user.id, username: user.username, role: user.role });
  } catch (error) {
    console.error("Controller error in login:", error);
    res.status(500).json({ error: "Error logging in" });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;
    const userEmail = req.userEmail;

    const user = await userModel.getUserByEmail(userEmail);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(userId, newHash);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Controller error in changePassword:", error);
    res.status(500).json({ error: "Error changing password" });
  }
}

module.exports = { register, login, changePassword };