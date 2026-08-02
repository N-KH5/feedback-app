const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      default: "",
    },

    storedFileName: {
      type: String,
      default: "",
    },

    fileUrl: {
      type: String,
      default: "",
    },

    fileType: {
      type: String,
      default: "",
    },

    fileSize: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: true,
  }
);

const feedbackQuestionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [
        true,
        "Question key is required",
      ],
      trim: true,
      maxlength: [
        100,
        "Question key cannot exceed 100 characters",
      ],
    },

    text: {
      type: String,
      required: [
        true,
        "Question text is required",
      ],
      trim: true,
      maxlength: [
        300,
        "Question text cannot exceed 300 characters",
      ],
    },

    type: {
      type: String,
      enum: ["rating", "text"],
      required: [
        true,
        "Question type is required",
      ],
    },

    required: {
      type: Boolean,
      default: false,
    },

    order: {
      type: Number,
      default: 0,
      min: 0,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);

const createDefaultQuestions = () => [
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

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [
        true,
        "Module title is required",
      ],
      trim: true,
      maxlength: [
        100,
        "Title cannot be longer than 100 characters",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Description cannot be longer than 1000 characters",
      ],
      default: "",
    },

    materials: {
      type: [materialSchema],
      default: [],
    },

    feedbackQuestions: {
      type: [feedbackQuestionSchema],
      default: createDefaultQuestions,
      validate: {
        validator(questions) {
          if (!Array.isArray(questions)) {
            return false;
          }

          const keys = questions.map(
            (question) => question.key
          );

          return (
            new Set(keys).size ===
            keys.length
          );
        },

        message:
          "Feedback question keys must be unique",
      },
    },

    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [
        true,
        "Trainer is required",
      ],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

moduleSchema.pre(
  "validate",
  function normalizeQuestions() {
    if (
      !Array.isArray(
        this.feedbackQuestions
      ) ||
      this.feedbackQuestions.length ===
        0
    ) {
      this.feedbackQuestions =
        createDefaultQuestions();
    }

    this.feedbackQuestions =
      this.feedbackQuestions.map(
        (question, index) => {
          const questionObject =
            typeof question.toObject ===
            "function"
              ? question.toObject()
              : question;

          const questionType =
            questionObject.type ===
            "text"
              ? "text"
              : "rating";

          return {
            ...questionObject,

            key:
              typeof questionObject.key ===
                "string" &&
              questionObject.key.trim()
                ? questionObject.key.trim()
                : `question_${Date.now()}_${index}`,

            text:
              typeof questionObject.text ===
              "string"
                ? questionObject.text.trim()
                : "",

            type: questionType,

            required:
              questionType ===
              "rating"
                ? questionObject.required !==
                  false
                : Boolean(
                    questionObject.required
                  ),

            order: index,

            isDefault:
              Boolean(
                questionObject.isDefault
              ),
          };
        }
      );
  }
);

moduleSchema.methods.getOrderedFeedbackQuestions =
  function getOrderedFeedbackQuestions() {
    return [
      ...this.feedbackQuestions,
    ].sort(
      (
        firstQuestion,
        secondQuestion
      ) =>
        firstQuestion.order -
        secondQuestion.order
    );
  };

module.exports = mongoose.model(
  "Module",
  moduleSchema
);