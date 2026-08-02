const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const feedbackSessionRoutes = require("./routes/feedbackSessionRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// CORS
app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

// Body parsers
app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// Make uploaded PDFs and images publicly accessible
app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

// Test route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Feedback App API is running",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/modules", moduleRoutes);
app.use(
  "/api/sessions",
  feedbackSessionRoutes
);
app.use("/api/feedback", feedbackRoutes);

// Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error(
    "Global server error:",
    error
  );

  if (
    error.code ===
    "LIMIT_FILE_SIZE"
  ) {
    return res.status(400).json({
      success: false,
      message:
        "The uploaded file is larger than 10 MB",
    });
  }

  if (
    error.name ===
    "MulterError"
  ) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "File upload failed",
    });
  }

  return res
    .status(error.status || 500)
    .json({
      success: false,
      message:
        error.message ||
        "Internal server error",
    });
});

const PORT =
  process.env.PORT || 5000;

const startServer = async () => {
  try {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `Server is running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Server failed to start:",
      error.message
    );

    process.exit(1);
  }
};

startServer();