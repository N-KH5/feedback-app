const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const Module = require("../models/Module");

const uploadsDirectory = path.join(
  __dirname,
  "..",
  "uploads"
);

const DEFAULT_QUESTIONS = [
  {
    key: "overall",
    text:
      "Overall, how satisfied are you with today's session?",
    type: "rating",
    required: true,
    order: 0,
    isDefault: true,
  },
  {
    key: "trainer",
    text:
      "How would you rate the instructor?",
    type: "rating",
    required: true,
    order: 1,
    isDefault: true,
  },
  {
    key: "content",
    text:
      "How would you rate the content?",
    type: "rating",
    required: true,
    order: 2,
    isDefault: true,
  },
  {
    key: "pace",
    text:
      "How would you rate the pace?",
    type: "rating",
    required: true,
    order: 3,
    isDefault: true,
  },
  {
    key: "keep",
    text:
      "What should be kept?",
    type: "text",
    required: false,
    order: 4,
    isDefault: true,
  },
  {
    key: "stop",
    text:
      "What should be stopped?",
    type: "text",
    required: false,
    order: 5,
    isDefault: true,
  },
  {
    key: "start",
    text:
      "What should be started or improved?",
    type: "text",
    required: false,
    order: 6,
    isDefault: true,
  },
  {
    key: "additionalComment",
    text:
      "Additional comments",
    type: "text",
    required: false,
    order: 7,
    isDefault: true,
  },
];

const getUserId = (user) => {
  return user?._id || user?.id;
};

const isModuleOwner = (
  learningModule,
  userId
) => {
  if (
    !learningModule?.trainer ||
    !userId
  ) {
    return false;
  }

  return (
    learningModule.trainer.toString() ===
    userId.toString()
  );
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return Boolean(value);
};

const parseStringArray = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return [];
    }

    try {
      const parsedValue =
        JSON.parse(trimmedValue);

      if (
        Array.isArray(parsedValue)
      ) {
        return parsedValue
          .map((item) =>
            String(item)
          )
          .filter(Boolean);
      }
    } catch {
      return [trimmedValue];
    }
  }

  return [];
};

const createQuestionKey = (
  index
) => {
  if (
    typeof crypto.randomUUID ===
    "function"
  ) {
    return `question_${crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 12)}`;
  }

  return `question_${Date.now()}_${index}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const parseFeedbackQuestions = (
  value
) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return DEFAULT_QUESTIONS.map(
      (question) => ({
        ...question,
      })
    );
  }

  let parsedValue = value;

  if (typeof value === "string") {
    try {
      parsedValue =
        JSON.parse(value);
    } catch {
      throw new Error(
        "Feedback questions must be valid JSON"
      );
    }
  }

  if (!Array.isArray(parsedValue)) {
    throw new Error(
      "Feedback questions must be an array"
    );
  }

  if (parsedValue.length === 0) {
    throw new Error(
      "At least one feedback question is required"
    );
  }

  if (parsedValue.length > 30) {
    throw new Error(
      "A module cannot contain more than 30 feedback questions"
    );
  }

  const normalizedQuestions =
    parsedValue.map(
      (question, index) => {
        if (
          !question ||
          typeof question !==
            "object" ||
          Array.isArray(question)
        ) {
          throw new Error(
            `Question ${index + 1} is invalid`
          );
        }

        const text =
          typeof question.text ===
          "string"
            ? question.text.trim()
            : "";

        if (!text) {
          throw new Error(
            `Question ${index + 1} must contain text`
          );
        }

        if (text.length > 300) {
          throw new Error(
            `Question ${index + 1} cannot exceed 300 characters`
          );
        }

        const type =
          question.type === "text"
            ? "text"
            : question.type ===
                "rating"
              ? "rating"
              : null;

        if (!type) {
          throw new Error(
            `Question ${index + 1} must use the type rating or text`
          );
        }

        const key =
          typeof question.key ===
            "string" &&
          question.key.trim()
            ? question.key
                .trim()
                .replace(
                  /[^a-zA-Z0-9_-]/g,
                  "_"
                )
                .slice(0, 100)
            : createQuestionKey(
                index
              );

        return {
          key,
          text,
          type,
          required:
            type === "rating"
              ? question.required !==
                false
              : parseBoolean(
                  question.required
                ),
          order: index,
          isDefault:
            Boolean(
              question.isDefault
            ),
        };
      }
    );

  const questionKeys =
    normalizedQuestions.map(
      (question) =>
        question.key
    );

  if (
    new Set(questionKeys).size !==
    questionKeys.length
  ) {
    throw new Error(
      "Feedback question keys must be unique"
    );
  }

  return normalizedQuestions;
};

const deleteStoredFile = async (
  storedFileName
) => {
  if (!storedFileName) {
    return;
  }

  const filePath = path.join(
    uploadsDirectory,
    storedFileName
  );

  try {
    await fs.promises.unlink(
      filePath
    );
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(
        "Delete uploaded file error:",
        error
      );
    }
  }
};

const deleteStoredFiles = async (
  storedFileNames
) => {
  await Promise.all(
    storedFileNames
      .filter(Boolean)
      .map((storedFileName) =>
        deleteStoredFile(
          storedFileName
        )
      )
  );
};

const createMaterialData = (
  file
) => {
  return {
    fileName:
      file.originalname,
    storedFileName:
      file.filename,
    fileUrl:
      `/uploads/${file.filename}`,
    fileType:
      file.mimetype,
    fileSize:
      file.size,
  };
};

const createMaterialsData = (
  files = []
) => {
  return files.map(
    createMaterialData
  );
};

const removeNewUploadsAfterError =
  async (req) => {
    const storedFileNames = (
      req.files || []
    )
      .map(
        (file) =>
          file.filename
      )
      .filter(Boolean);

    await deleteStoredFiles(
      storedFileNames
    );
  };

const getValidationMessage = (
  error
) => {
  if (
    error.name !==
    "ValidationError"
  ) {
    return null;
  }

  return Object.values(
    error.errors
  )
    .map(
      (validationError) =>
        validationError.message
    )
    .join(", ");
};
// Create a module
const createModule = async (
  req,
  res
) => {
  try {
    const {
      title,
      description = "",
      feedbackQuestions,
    } = req.body;

    if (
      typeof title !==
        "string" ||
      !title.trim()
    ) {
      await removeNewUploadsAfterError(
        req
      );

      return res.status(400).json({
        success: false,
        message:
          "Module title is required",
      });
    }

    if (
      typeof description !==
      "string"
    ) {
      await removeNewUploadsAfterError(
        req
      );

      return res.status(400).json({
        success: false,
        message:
          "Description must contain text",
      });
    }

    let parsedFeedbackQuestions;

    try {
      parsedFeedbackQuestions =
        parseFeedbackQuestions(
          feedbackQuestions
        );
    } catch (questionError) {
      await removeNewUploadsAfterError(
        req
      );

      return res.status(400).json({
        success: false,
        message:
          questionError.message,
      });
    }

    const userId =
      getUserId(req.user);

    const materials =
      createMaterialsData(
        req.files || []
      );

    const learningModule =
      await Module.create({
        title:
          title.trim(),

        description:
          description.trim(),

        materials,

        feedbackQuestions:
          parsedFeedbackQuestions,

        trainer:
          userId,

        createdBy:
          userId,
      });

    const populatedModule =
      await Module.findById(
        learningModule._id
      )
        .populate(
          "trainer",
          "name email role"
        )
        .populate(
          "createdBy",
          "name email role"
        );

    return res.status(201).json({
      success: true,
      message:
        "Learning module created successfully",
      module:
        populatedModule,
    });
  } catch (error) {
    await removeNewUploadsAfterError(
      req
    );

    console.error(
      "Create module error:",
      error
    );

    const validationMessage =
      getValidationMessage(
        error
      );

    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message:
          validationMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating module",
    });
  }
};

// Get modules
const getModules = async (
  req,
  res
) => {
  try {
    const filter =
      req.user.role ===
      "admin"
        ? {}
        : {
            trainer:
              getUserId(
                req.user
              ),
          };

    const modules =
      await Module.find(
        filter
      )
        .populate(
          "trainer",
          "name email role"
        )
        .populate(
          "createdBy",
          "name email role"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count:
        modules.length,
      modules,
    });
  } catch (error) {
    console.error(
      "Get modules error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while getting modules",
    });
  }
};

// Get one module
const getModuleById = async (
  req,
  res
) => {
  try {
    const learningModule =
      await Module.findById(
        req.params.id
      )
        .populate(
          "trainer",
          "name email role"
        )
        .populate(
          "createdBy",
          "name email role"
        );

    if (!learningModule) {
      return res.status(404).json({
        success: false,
        message:
          "Learning module not found",
      });
    }

    const trainerId =
      learningModule.trainer
        ?._id ||
      learningModule.trainer;

    if (
      req.user.role ===
        "trainer" &&
      trainerId.toString() !==
        getUserId(
          req.user
        ).toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot access another instructor's module",
      });
    }

    return res.status(200).json({
      success: true,
      module:
        learningModule,
    });
  } catch (error) {
    console.error(
      "Get module error:",
      error
    );

    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid module ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while getting module",
    });
  }
};
// Update a module
const updateModule = async (
  req,
  res
) => {
  try {
    const {
      title,
      description,
      isActive,
      feedbackQuestions,
      removeMaterialIds,
      removeAllMaterials,
    } = req.body;

    const learningModule =
      await Module.findById(
        req.params.id
      );

    if (!learningModule) {
      await removeNewUploadsAfterError(
        req
      );

      return res.status(404).json({
        success: false,
        message:
          "Learning module not found",
      });
    }

    if (
      req.user.role ===
        "trainer" &&
      !isModuleOwner(
        learningModule,
        getUserId(
          req.user
        )
      )
    ) {
      await removeNewUploadsAfterError(
        req
      );

      return res.status(403).json({
        success: false,
        message:
          "You cannot update another instructor's module",
      });
    }

    if (
      title !== undefined
    ) {
      if (
        typeof title !==
          "string" ||
        !title.trim()
      ) {
        await removeNewUploadsAfterError(
          req
        );

        return res.status(400).json({
          success: false,
          message:
            "Module title cannot be empty",
        });
      }

      learningModule.title =
        title.trim();
    }

    if (
      description !== undefined
    ) {
      if (
        typeof description !==
          "string"
      ) {
        await removeNewUploadsAfterError(
          req
        );

        return res.status(400).json({
          success: false,
          message:
            "Description must contain text",
        });
      }

      learningModule.description =
        description.trim();
    }

    if (
      isActive !== undefined
    ) {
      learningModule.isActive =
        parseBoolean(
          isActive
        );
    }

    if (
      feedbackQuestions !==
      undefined
    ) {
      try {
        learningModule.feedbackQuestions =
          parseFeedbackQuestions(
            feedbackQuestions
          );
      } catch (
        questionError
      ) {
        await removeNewUploadsAfterError(
          req
        );

        return res.status(400).json({
          success: false,
          message:
            questionError.message,
        });
      }
    }

    const currentMaterials = [
      ...(
        learningModule.materials ||
        []
      ),
    ];

    const storedFileNamesToDelete =
      [];

    let nextMaterials =
      currentMaterials;

    if (
      parseBoolean(
        removeAllMaterials
      )
    ) {
      currentMaterials.forEach(
        (material) => {
          if (
            material
              .storedFileName
          ) {
            storedFileNamesToDelete.push(
              material
                .storedFileName
            );
          }
        }
      );

      nextMaterials = [];
    } else {
      const materialIdsToRemove =
        parseStringArray(
          removeMaterialIds
        );

      if (
        materialIdsToRemove.length >
        0
      ) {
        nextMaterials =
          currentMaterials.filter(
            (material) => {
              const materialId =
                material._id
                  ?.toString();

              const shouldRemove =
                materialId &&
                materialIdsToRemove.includes(
                  materialId
                );

              if (
                shouldRemove &&
                material
                  .storedFileName
              ) {
                storedFileNamesToDelete.push(
                  material
                    .storedFileName
                );
              }

              return !shouldRemove;
            }
          );
      }
    }

    const newMaterials =
      createMaterialsData(
        req.files || []
      );

    learningModule.materials = [
      ...nextMaterials,
      ...newMaterials,
    ];

    await learningModule.save();

    await deleteStoredFiles(
      storedFileNamesToDelete
    );

    const updatedModule =
      await Module.findById(
        learningModule._id
      )
        .populate(
          "trainer",
          "name email role"
        )
        .populate(
          "createdBy",
          "name email role"
        );

    return res.status(200).json({
      success: true,
      message:
        "Learning module updated successfully",
      module:
        updatedModule,
    });
  } catch (error) {
    await removeNewUploadsAfterError(
      req
    );

    console.error(
      "Update module error:",
      error
    );

    const validationMessage =
      getValidationMessage(
        error
      );

    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message:
          validationMessage,
      });
    }

    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid module ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating module",
    });
  }
};
// Delete a module and all its files
const deleteModule = async (
  req,
  res
) => {
  try {
    const learningModule =
      await Module.findById(
        req.params.id
      );

    if (!learningModule) {
      return res.status(404).json({
        success: false,
        message:
          "Learning module not found",
      });
    }

    if (
      req.user.role ===
        "trainer" &&
      !isModuleOwner(
        learningModule,
        getUserId(
          req.user
        )
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot delete another instructor's module",
      });
    }

    const storedFileNames = (
      learningModule.materials ||
      []
    )
      .map(
        (material) =>
          material
            .storedFileName
      )
      .filter(Boolean);

    await learningModule.deleteOne();

    await deleteStoredFiles(
      storedFileNames
    );

    return res.status(200).json({
      success: true,
      message:
        "Learning module deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete module error:",
      error
    );

    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid module ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting module",
    });
  }
};

module.exports = {
  createModule,
  getModules,
  getModuleById,
  updateModule,
  deleteModule,
};