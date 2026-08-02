const User = require("../models/User");

exports.getTrainers = async (req, res) => {
  try {
    const trainers = await User.find({ role: "trainer" }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: trainers.length,
      trainers,
    });
  } catch (error) {
    console.error("Get trainers error:", error);

    res.status(500).json({
      success: false,
      message: "Could not load trainers.",
    });
  }
};

exports.updateTrainer = async (req, res) => {
  try {
    const { name, email, isActive } = req.body;

    const trainer = await User.findOne({
      _id: req.params.id,
      role: "trainer",
    });

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found.",
      });
    }

    if (name !== undefined) {
      trainer.name = name;
    }

    if (email !== undefined) {
      trainer.email = email;
    }

    if (isActive !== undefined) {
      trainer.isActive = isActive;
    }

    await trainer.save();

    res.status(200).json({
      success: true,
      message: "Trainer updated successfully.",
      trainer,
    });
  } catch (error) {
    console.error("Update trainer error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This email address is already in use.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Could not update trainer.",
    });
  }
};

exports.resetTrainerPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const trainer = await User.findOne({
      _id: req.params.id,
      role: "trainer",
    }).select("+password");

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found.",
      });
    }

    trainer.password = password;
    await trainer.save();

    res.status(200).json({
      success: true,
      message: "Trainer password reset successfully.",
    });
  } catch (error) {
    console.error("Reset trainer password error:", error);

    res.status(500).json({
      success: false,
      message: "Could not reset trainer password.",
    });
  }
};

exports.deleteTrainer = async (req, res) => {
  try {
    const trainer = await User.findOneAndDelete({
      _id: req.params.id,
      role: "trainer",
    });

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Trainer deleted successfully.",
    });
  } catch (error) {
    console.error("Delete trainer error:", error);

    res.status(500).json({
      success: false,
      message: "Could not delete trainer.",
    });
  }
};