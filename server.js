require("dotenv").config();

const express = require("express");
const cors = require("cors");
const passport = require("passport");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/error");

// Load Google Passport strategy
require("./config/passport");

const app = express();
app.set('trust proxy', 1);

/* ---------------- CORS ---------------- */

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* ---------------- MIDDLEWARE ---------------- */

app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Initialize Passport
app.use(passport.initialize());

/* ---------------- TEST ROUTE ---------------- */

app.get("/", (req, res) => {
  res.json({
    message: "TaskDesk backend is running",
  });
});

/* ---------------- API ROUTES ---------------- */

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));

/* ---------------- ERROR HANDLING ---------------- */

app.use(notFound);
app.use(errorHandler);

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
});