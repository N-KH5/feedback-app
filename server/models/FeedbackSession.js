const mongoose = require("mongoose");

const sessionQuestionSchema =
  new mongoose.Schema(
    {
      sourceQuestionId: {
        type:
          mongoose.Schema.Types.ObjectId,
        default: null,
      },

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

const materialSnapshotSchema =
  new mongoose.Schema(
    {
      fileName: {
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

const feedbackSessionSchema =
  new mongoose.Schema(
    {
      module: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Module",
        required: [
          true,
          "Learning module is required",
        ],
      },

      moduleSnapshot: {
        title: {
          type: String,
          trim: true,
          default: "",
        },

        description: {
          type: String,
          trim: true,
          default: "",
        },

        materials: {
          type: [
            materialSnapshotSchema,
          ],
          default: [],
        },

        feedbackQuestions: {
          type: [
            sessionQuestionSchema,
          ],
          default: [],
        },
      },

      sessionCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
      },

      createdBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      status: {
        type: String,
        enum: [
          "waiting",
          "open",
          "closed",
        ],
        default: "waiting",
      },

      durationMinutes: {
        type: Number,
        required: true,
        min: [
          1,
          "Duration must be at least 1 minute",
        ],
        max: [
          60,
          "Duration cannot exceed 60 minutes",
        ],
        default: 10,
      },

      expectedParticipants: {
        type: Number,
        default: null,
        min: [
          1,
          "Expected participants must be at least 1",
        ],
        max: [
          10000,
          "Expected participants cannot exceed 10000",
        ],
      },

      startTime: {
        type: Date,
        default: null,
      },

      endTime: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

feedbackSessionSchema.pre(
  "validate",
  function normalizeSnapshotQuestions() {
    const questions =
      this.moduleSnapshot
        ?.feedbackQuestions;

    if (!Array.isArray(questions)) {
      if (this.moduleSnapshot) {
        this.moduleSnapshot.feedbackQuestions =
          [];
      }

      return;
    }

    this.moduleSnapshot.feedbackQuestions =
      questions
        .map(
          (
            question,
            index
          ) => {
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

              sourceQuestionId:
                questionObject
                  .sourceQuestionId ||
                questionObject._id ||
                null,

              key:
                typeof questionObject.key ===
                  "string" &&
                questionObject.key.trim()
                  ? questionObject.key.trim()
                  : `question_${index}`,

              text:
                typeof questionObject.text ===
                "string"
                  ? questionObject.text.trim()
                  : "",

              type:
                questionType,

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
        )
        .filter(
          (question) =>
            question.text
        );
  }
);

feedbackSessionSchema.methods.getOrderedQuestions =
  function getOrderedQuestions() {
    return [
      ...(
        this.moduleSnapshot
          ?.feedbackQuestions ||
        []
      ),
    ].sort(
      (
        firstQuestion,
        secondQuestion
      ) =>
        firstQuestion.order -
        secondQuestion.order
    );
  };

module.exports =
  mongoose.model(
    "FeedbackSession",
    feedbackSessionSchema
  );