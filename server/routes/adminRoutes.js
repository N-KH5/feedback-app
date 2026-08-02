const express = require("express");

const {
  getTrainers,
  updateTrainer,
  resetTrainerPassword,
  deleteTrainer,
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const { authoriseRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authoriseRoles("admin"));

router.get("/trainers", getTrainers);
router.patch("/trainers/:id", updateTrainer);
router.patch("/trainers/:id/password", resetTrainerPassword);
router.delete("/trainers/:id", deleteTrainer);

module.exports = router;