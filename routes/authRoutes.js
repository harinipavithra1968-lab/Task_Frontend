const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();

// ======================================================
// CREATE JWT TOKEN
// ======================================================

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ======================================================
// AUTH MIDDLEWARE
// ======================================================

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized. Token missing.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

// ======================================================
// REGISTER
// POST /api/auth/register
// ======================================================

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email and password are required.",
      });
    }

    // Validate username
    if (username.trim().length < 3) {
      return res.status(400).json({
        message: "Username must be at least 3 characters.",
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check existing email
    const existingEmail = await User.findOne({
      email: cleanEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        message: "Email already registered.",
      });
    }

    // Check existing username
    const existingUsername = await User.findOne({
      username: cleanUsername.toLowerCase(),
    });

    if (existingUsername) {
      return res.status(409).json({
        message: "Username already taken.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username: cleanUsername.toLowerCase(),
      email: cleanEmail,
      password: hashedPassword,
      authProvider: "local",
    });

    // Create JWT
    const token = createToken(user);

    // Send response
    res.status(201).json({
      message: "Account created successfully.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage || "",
        authProvider: user.authProvider || "local",
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      message: "Server error during registration.",
    });
  }
});

// ======================================================
// LOGIN
// POST /api/auth/login
// ======================================================

router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Email/username and password are required.",
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Allow login using either email OR username
    const user = await User.findOne({
      $or: [
        {
          email: cleanIdentifier,
        },
        {
          username: cleanIdentifier,
        },
      ],
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid username/email or password.",
      });
    }

    // Google-only account
    if (!user.password) {
      return res.status(401).json({
        message:
          "This account uses Google login. Please sign in with Google.",
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid username/email or password.",
      });
    }

    // Create JWT
    const token = createToken(user);

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage || "",
        authProvider: user.authProvider || "local",
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error during login.",
    });
  }
});

// ======================================================
// GET CURRENT USER
// GET /api/auth/me
// ======================================================

router.get("/me", protect, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        profileImage: req.user.profileImage || "",
        authProvider: req.user.authProvider || "local",
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    res.status(500).json({
      message: "Unable to get user information.",
    });
  }
});

module.exports = router;