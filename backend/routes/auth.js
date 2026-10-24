
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const router = express.Router();

// Validate request body
function validCredentials(body) {
  return (
    body &&
    typeof body.email === "string" &&
    typeof body.password === "string" &&
    body.email.trim().length > 0 &&
    body.password.length > 0
  );
}

// One-time initial Admin setup
router.post("/setup-admin", async (req, res) => {
  try {
    const { name, email, password, setupKey } = req.body || {};

    if (!process.env.ADMIN_SETUP_KEY || !process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Server authentication settings are missing.",
      });
    }

    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(403).json({ message: "Invalid setup key." });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !/^\S+@\S+\.\S+$/.test(email.trim()) ||
      password.length < 12
    ) {
      return res.status(422).json({
        message: "Enter a valid name, email and password of at least 12 characters.",
      });
    }

    if (await User.exists({ role: "Admin" })) {
      return res.status(403).json({
        message: "Admin setup has already been completed.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({
        message: "Email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "Admin",
      mustChangePassword: false,
    });

    return res.status(201).json({
      message: "Initial Admin created successfully.",
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin setup error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email is already registered.",
      });
    }

    return res.status(500).json({
      message: "Could not create Admin.",
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    if (!validCredentials(req.body)) {
      return res.status(400).json({
        message: "Email and password are required. Send JSON with email and password fields.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "JWT_SECRET is missing from server configuration.",
      });
    }

    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (!user.password) {
      console.error("Login failed: password hash missing for account.");
      return res.status(500).json({
        message: "Account password is not configured. Reset the password.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Login failed due to a server error.",
    });
  }
});

module.exports = router;
