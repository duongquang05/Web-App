const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const participantRoutes = require("./routes/participantRoutes");
const adminRoutes = require("./routes/adminRoutes");
const passingPointRoutes = require("./routes/passingPointRoutes");

const app = express();

/* =====================
   MIDDLEWARE
===================== */
const parseCorsOrigins = (value) => {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);
// Back-compat + simplicity: if no allowlist is configured, allow all.
// Set CORS_ORIGINS (comma-separated) to enforce an allowlist in production.
const allowAllCors =
  process.env.CORS_ALLOW_ALL === "true" ||
  corsOrigins.length === 0 ||
  !process.env.NODE_ENV ||
  process.env.NODE_ENV === "development";

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowAllCors) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

/* =====================
   BASIC ROUTES
===================== */

// Home route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Health check behind /api proxy (nginx/ALB commonly routes only /api/* to backend)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* =====================
   API ROUTES
===================== */
app.use("/api/auth", authRoutes);
app.use("/api", participantRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", passingPointRoutes);

/* =====================
   404 HANDLER
===================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* =====================
   GLOBAL ERROR HANDLER
===================== */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;
