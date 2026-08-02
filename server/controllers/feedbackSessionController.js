const FeedbackSession = require("../models/FeedbackSession");
const Feedback = require("../models/Feedback");
const Module = require("../models/Module");

const getUserId = (user) => {
  return user?._id || user?.id;
};

const canAccessSession = (session, user) => {
  if (!session || !user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  const creatorId =
    session.createdBy?._id || session.createdBy;

  const userId = getUserId(user);

  if (!creatorId || !userId) {
    return false;
  }

  return creatorId.toString() === userId.toString();
};

const createSessionCode = async () => {
  let sessionCode;
  let codeExists = true;

  while (codeExists) {
    sessionCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    codeExists = await FeedbackSession.exists({
      sessionCode,
    });
  }

  return sessionCode;
};

const closeExpiredSession = async (session) => {
  if (
    session.status === "open" &&
    session.endTime &&
    new Date() >= new Date(session.endTime)
  ) {
    session.status = "closed";

    await session.save();
  }

  return session;
};

const closeExpiredSessions = async () => {
  await FeedbackSession.updateMany(
    {
      status: "open",
      endTime: {
        $ne: null,
        $lte: new Date(),
      },
    },
    {
      $set: {
        status: "closed",
      },
    }
  );
};

const createModuleSnapshot = (learningModule) => {
  return {
    title: learningModule.title || "",
    description: learningModule.description || "",

    materials: (learningModule.materials || []).map(
      (material) => ({
        fileName: material.fileName || "",
        fileUrl: material.fileUrl || "",
        fileType: material.fileType || "",
        fileSize: material.fileSize || 0,
      })
    ),

    feedbackQuestions: (
      learningModule.feedbackQuestions || []
    ).map((question, index) => ({
      sourceQuestionId: question._id || null,
      key: question.key,
      text: question.text,
      type: question.type,
      required: question.required,
      order:
        typeof question.order === "number"
          ? question.order
          : index,
      isDefault: Boolean(question.isDefault),
    })),
  };
};

const populateProtectedSession = (query) => {
  return query
    .populate(
      "module",
      "title description materials feedbackQuestions isActive"
    )
    .populate(
      "createdBy",
      "name email role"
    );
};

const populatePublicSession = (query) => {
  return query
    .populate(
      "module",
      "title description materials feedbackQuestions"
    )
    .populate(
      "createdBy",
      "name"
    );
};

const createSession = async (req, res) => {
  try {
    const {
      module,
      durationMinutes = 10,
      expectedParticipants = null,
    } = req.body;

    if (!module) {
      return res.status(400).json({
        success: false,
        message: "Module is required",
      });
    }

    const parsedDuration = Number(
      durationMinutes
    );

    if (
      !Number.isInteger(parsedDuration) ||
      parsedDuration < 1 ||
      parsedDuration > 60
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Duration must be a whole number between 1 and 60 minutes",
      });
    }

    let parsedExpectedParticipants = null;

    if (
      expectedParticipants !== null &&
      expectedParticipants !== undefined &&
      expectedParticipants !== ""
    ) {
      parsedExpectedParticipants = Number(
        expectedParticipants
      );

      if (
        !Number.isInteger(
          parsedExpectedParticipants
        ) ||
        parsedExpectedParticipants < 1 ||
        parsedExpectedParticipants > 10000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Expected participants must be a whole number between 1 and 10000",
        });
      }
    }

    const learningModule =
      await Module.findById(module);

    if (!learningModule) {
      return res.status(404).json({
        success: false,
        message:
          "Learning module not found",
      });
    }

    if (
      req.user.role === "trainer" &&
      learningModule.trainer.toString() !==
        getUserId(req.user).toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only create sessions for your own modules",
      });
    }

    if (!learningModule.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "A session cannot be created for an inactive module",
      });
    }

    if (
      !Array.isArray(
        learningModule.feedbackQuestions
      ) ||
      learningModule.feedbackQuestions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The module must contain at least one feedback question",
      });
    }

    const sessionCode =
      await createSessionCode();

    const session =
      await FeedbackSession.create({
        module: learningModule._id,

        moduleSnapshot:
          createModuleSnapshot(
            learningModule
          ),

        sessionCode,

        createdBy:
          getUserId(req.user),

        status: "waiting",

        durationMinutes:
          parsedDuration,

        expectedParticipants:
          parsedExpectedParticipants,

        startTime: null,
        endTime: null,
      });

    const populatedSession =
      await populateProtectedSession(
        FeedbackSession.findById(
          session._id
        )
      );

    return res.status(201).json({
      success: true,
      message:
        "Feedback session created. Start it when participants are ready.",
      session:
        populatedSession,
    });
  } catch (error) {
    console.error(
      "Create session error:",
      error
    );

    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid module ID",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating feedback session",
    });
  }
};

const startSession = async (req, res) => {
  try {
    const session =
      await FeedbackSession.findById(
        req.params.id
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Feedback session not found",
      });
    }

    if (
      !canAccessSession(
        session,
        req.user
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot start another instructor's session",
      });
    }

    if (
      session.status === "open"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Feedback session has already started",
      });
    }

    if (
      session.status === "closed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A closed session cannot be started again",
      });
    }

    const startTime = new Date();

    session.status = "open";
    session.startTime = startTime;
    session.endTime = new Date(
      startTime.getTime() +
        session.durationMinutes *
          60 *
          1000
    );

    await session.save();

    const populatedSession =
      await populateProtectedSession(
        FeedbackSession.findById(
          session._id
        )
      );

    return res.status(200).json({
      success: true,
      message:
        "Feedback session started successfully",
      session:
        populatedSession,
    });
  } catch (error) {
    console.error(
      "Start session error:",
      error
    );

    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid session ID",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while starting feedback session",
    });
  }
};

const getSessions = async (req, res) => {
  try {
    await closeExpiredSessions();

    const filter =
      req.user.role === "admin"
        ? {}
        : {
            createdBy:
              getUserId(req.user),
          };

    const sessions =
      await populateProtectedSession(
        FeedbackSession.find(filter)
      ).sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error(
      "Get sessions error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while getting feedback sessions",
    });
  }
};

const getSessionById = async (
  req,
  res
) => {
  try {
    let session =
      await FeedbackSession.findById(
        req.params.id
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Feedback session not found",
      });
    }

    if (
      !canAccessSession(
        session,
        req.user
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot access another instructor's session",
      });
    }

    await closeExpiredSession(
      session
    );

    session =
      await populateProtectedSession(
        FeedbackSession.findById(
          session._id
        )
      );

    return res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error(
      "Get session error:",
      error
    );

    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid session ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while getting feedback session",
    });
  }
};

const getSessionByCode = async (
  req,
  res
) => {
  try {
    const sessionCode =
      req.params.code
        .trim()
        .toUpperCase();

    let session =
      await FeedbackSession.findOne({
        sessionCode,
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Feedback session not found",
      });
    }

    await closeExpiredSession(
      session
    );

    session =
      await populatePublicSession(
        FeedbackSession.findById(
          session._id
        )
      );

    return res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error(
      "Get session by code error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while getting feedback session",
    });
  }
};

const closeSession = async (
  req,
  res
) => {
  try {
    const session =
      await FeedbackSession.findById(
        req.params.id
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Feedback session not found",
      });
    }

    if (
      !canAccessSession(
        session,
        req.user
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot close another instructor's session",
      });
    }

    if (
      session.status === "closed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Feedback session is already closed",
      });
    }

    session.status = "closed";

    if (
      !session.endTime ||
      new Date() <
        session.endTime
    ) {
      session.endTime =
        new Date();
    }

    await session.save();

    const updatedSession =
      await populateProtectedSession(
        FeedbackSession.findById(
          session._id
        )
      );

    return res.status(200).json({
      success: true,
      message:
        "Feedback session closed successfully",
      session:
        updatedSession,
    });
  } catch (error) {
    console.error(
      "Close session error:",
      error
    );

    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid session ID",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while closing feedback session",
    });
  }
};

const deleteSession = async (
  req,
  res
) => {
  try {
    const session =
      await FeedbackSession.findById(
        req.params.id
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Feedback session not found",
      });
    }

    if (
      !canAccessSession(
        session,
        req.user
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot delete another instructor's session",
      });
    }

    await closeExpiredSession(
      session
    );

    if (
      session.status !== "closed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Close the feedback session before deleting it",
      });
    }

    const deletedFeedback =
      await Feedback.deleteMany({
        session:
          session._id,
      });

    await session.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Feedback session permanently deleted",
      deletedFeedbackCount:
        deletedFeedback.deletedCount,
    });
  } catch (error) {
    console.error(
      "Delete session error:",
      error
    );

    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid session ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting feedback session",
    });
  }
};

module.exports = {
  createSession,
  startSession,
  getSessions,
  getSessionById,
  getSessionByCode,
  closeSession,
  deleteSession,
};