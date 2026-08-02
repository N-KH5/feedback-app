const express = require("express");

const {
  submitFeedback,
  getFeedbacksBySession,
  getFeedbackSummary,
  getResponseCount,
} = require("../controllers/feedbackController");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authoriseRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

// Public route for participants
router.post("/", submitFeedback);

// Protected route for live response count
router.get(
  "/session/:sessionId/count",
  protect,
  authoriseRoles("admin", "trainer"),
  getResponseCount
);

// Protected route for all feedback entries
router.get(
  "/session/:sessionId",
  protect,
  authoriseRoles("admin", "trainer"),
  getFeedbacksBySession
);

// Protected route for calculated summary
router.get(
  "/session/:sessionId/summary",
  protect,
  authoriseRoles("admin", "trainer"),
  getFeedbackSummary
);

module.exports = router;