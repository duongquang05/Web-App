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
app.use(cors());
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
