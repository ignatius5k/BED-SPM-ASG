const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

async function register(req, res) {
  try {
    const existingUser = await userModel.getUserByUsername(req.body.username);

    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await userModel.createUser({
      username: req.body.username,
      passwordHash,
      role: req.body.role,
    });

    res.status(201).json(user);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ message: "Error registering user" });
  }
}

async function login(req, res) {
  try {
    const user = await userModel.getUserByUsername(req.body.username);

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(req.body.password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ message: "Error logging in" });
  }
}

module.exports = {
  register,
  login,
};
