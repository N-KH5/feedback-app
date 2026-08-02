const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [
        true,
        "Question ID is required",
      ],
    },

    questionKey: {
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

    questionText: {
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

    questionType: {
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

    ratingValue: {
      type: Number,
      min: [
        1,
        "Rating must be at least 1",
      ],
      max: [
        5,
        "Rating cannot exceed 5",
      ],
      default: null,
    },

    textValue: {
      type: String,
      trim: true,
      maxlength: [
        1500,
        "Text answer cannot exceed 1500 characters",
      ],
      default: "",
    },
  },
  {
    _id: true,
  }
);

const feedbackSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeedbackSession",
      required: true,
    },

    participantToken: {
      type: String,
      required: true,
      trim: true,
    },

    participantName: {
      type: String,
      required: [
        true,
        "Participant name is required",
      ],
      trim: true,
      minlength: [
        1,
        "Participant name is required",
      ],
      maxlength: [
        100,
        "Participant name cannot exceed 100 characters",
      ],
    },

    answers: {
      type: [answerSchema],
      default: [],
      validate: [
        {
          validator(answers) {
            return (
              Array.isArray(answers) &&
              answers.length > 0
            );
          },
          message:
            "At least one feedback answer is required",
        },
        {
          validator(answers) {
            const questionIds =
              answers.map((answer) =>
                answer.questionId.toString()
              );

            return (
              new Set(questionIds).size ===
              questionIds.length
            );
          },
          message:
            "Each feedback question may only be answered once",
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.pre(
  "validate",
  function validateAnswers() {
    if (
      !Array.isArray(this.answers) ||
      this.answers.length === 0
    ) {
      return;
    }

    for (
      let index = 0;
      index < this.answers.length;
      index += 1
    ) {
      const answer =
        this.answers[index];

      answer.order = index;

      if (
        answer.questionType ===
        "rating"
      ) {
        const numericRating =
          Number(answer.ratingValue);

        if (
          !Number.isInteger(
            numericRating
          ) ||
          numericRating < 1 ||
          numericRating > 5
        ) {
          this.invalidate(
            `answers.${index}.ratingValue`,
            `Rating for "${answer.questionText}" must be a whole number between 1 and 5`
          );
        }

        answer.ratingValue =
          numericRating;

        answer.textValue = "";
      }

      if (
        answer.questionType ===
        "text"
      ) {
        const normalizedText =
          typeof answer.textValue ===
          "string"
            ? answer.textValue.trim()
            : "";

        if (
          answer.required &&
          !normalizedText
        ) {
          this.invalidate(
            `answers.${index}.textValue`,
            `Answer for "${answer.questionText}" is required`
          );
        }

        answer.textValue =
          normalizedText;

        answer.ratingValue =
          null;
      }
    }
  }
);

feedbackSchema.index(
  {
    session: 1,
    participantToken: 1,
  },
  {
    unique: true,
  }
);

feedbackSchema.index({
  session: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "Feedback",
  feedbackSchema
);