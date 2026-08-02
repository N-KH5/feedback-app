const express = require("express");

const {
  createSession,
  startSession,
  getSessions,
  getSessionById,
  getSessionByCode,
  closeSession,
  deleteSession,
} = require("../controllers/feedbackSessionController");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authoriseRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

// Public route for participants
router.get("/code/:code", getSessionByCode);

// All routes below require login
router.use(protect);

router.get(
  "/",
  authoriseRoles("admin", "trainer"),
  getSessions
);

router.post(
  "/",
  authoriseRoles("admin", "trainer"),
  createSession
);

router.patch(
  "/:id/start",
  authoriseRoles("admin", "trainer"),
  startSession
);

router.patch(
  "/:id/close",
  authoriseRoles("admin", "trainer"),
  closeSession
);

router.delete(
  "/:id",
  authoriseRoles("admin", "trainer"),
  deleteSession
);

router.get(
  "/:id",
  authoriseRoles("admin", "trainer"),
  getSessionById
);

module.exports = router;