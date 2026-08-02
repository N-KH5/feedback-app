const Feedback = require("../models/Feedback");
const FeedbackSession = require("../models/FeedbackSession");

const {
  findInappropriateField,
} = require("../utils/contentModeration");

const getUserId = (user) => {
  return user?._id || user?.id;
};

const canViewSessionResults = (
  session,
  user
) => {
  if (!session || !user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  const creatorId =
    session.createdBy?._id ||
    session.createdBy;

  const userId =
    getUserId(user);

  if (!creatorId || !userId) {
    return false;
  }

  return (
    creatorId.toString() ===
    userId.toString()
  );
};

const closeSessionIfExpired =
  async (session) => {
    if (
      session.status === "open" &&
      session.endTime &&
      Date.now() >=
        new Date(
          session.endTime
        ).getTime()
    ) {
      session.status = "closed";
      await session.save();
    }

    return session;
  };

const createSessionInformation = (
  session
) => {
  return {
    id: session._id,
    sessionCode:
      session.sessionCode,
    status: session.status,
    durationMinutes:
      session.durationMinutes,
    module: session.module,
    moduleSnapshot:
      session.moduleSnapshot,
    createdBy:
      session.createdBy,
    createdAt:
      session.createdAt,
    startTime:
      session.startTime,
    endTime:
      session.endTime,
  };
};

const getSessionQuestions = (
  session
) => {
  const questions =
    session?.moduleSnapshot
      ?.feedbackQuestions;

  if (!Array.isArray(questions)) {
    return [];
  }

  return [...questions].sort(
    (
      firstQuestion,
      secondQuestion
    ) =>
      firstQuestion.order -
      secondQuestion.order
  );
};

const normalizeQuestionId = (
  value
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value);
};

const createRatingDistribution =
  () => ({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });

const loadProtectedSession =
  async (sessionId) => {
    return FeedbackSession.findById(
      sessionId
    )
      .populate(
        "module",
        "title description materials feedbackQuestions isActive"
      )
      .populate(
        "createdBy",
        "name email role"
      );
  };

const validateAndNormalizeAnswers = (
  sessionQuestions,
  submittedAnswers
) => {
  if (
    !Array.isArray(
      submittedAnswers
    )
  ) {
    return {
      error: {
        code: "ANSWERS_REQUIRED",
        message:
          "Feedback answers are required.",
      },
    };
  }

  if (
    sessionQuestions.length === 0
  ) {
    return {
      error: {
        code: "NO_SESSION_QUESTIONS",
        message:
          "This feedback session has no questions.",
      },
    };
  }

  const submittedAnswersById =
    new Map();

  for (
    let index = 0;
    index <
    submittedAnswers.length;
    index += 1
  ) {
    const submittedAnswer =
      submittedAnswers[index];

    if (
      !submittedAnswer ||
      typeof submittedAnswer !==
        "object" ||
      Array.isArray(
        submittedAnswer
      )
    ) {
      return {
        error: {
          code:
            "INVALID_ANSWER",
          message: `Answer ${
            index + 1
          } is invalid.`,
        },
      };
    }

    const questionId =
      normalizeQuestionId(
        submittedAnswer.questionId
      );

    if (!questionId) {
      return {
        error: {
          code:
            "QUESTION_ID_REQUIRED",
          message: `Answer ${
            index + 1
          } has no question ID.`,
        },
      };
    }

    if (
      submittedAnswersById.has(
        questionId
      )
    ) {
      return {
        error: {
          code:
            "DUPLICATE_ANSWER",
          message:
            "Each feedback question may only be answered once.",
        },
      };
    }

    submittedAnswersById.set(
      questionId,
      submittedAnswer
    );
  }

  const normalizedAnswers = [];

  for (
    let index = 0;
    index <
    sessionQuestions.length;
    index += 1
  ) {
    const question =
      sessionQuestions[index];

    const questionId =
      normalizeQuestionId(
        question._id
      );

    const sourceQuestionId =
      normalizeQuestionId(
        question.sourceQuestionId
      );

    const submittedAnswer =
      submittedAnswersById.get(
        questionId
      ) ||
      submittedAnswersById.get(
        sourceQuestionId
      );

    if (
      question.type === "rating"
    ) {
      const ratingValue =
        Number(
          submittedAnswer
            ?.ratingValue
        );

      const hasValidRating =
        Number.isInteger(
          ratingValue
        ) &&
        ratingValue >= 1 &&
        ratingValue <= 5;

      if (
        question.required &&
        !hasValidRating
      ) {
        return {
          error: {
            code:
              "REQUIRED_ANSWER_MISSING",
            field: questionId,
            message: `Please answer "${question.text}".`,
          },
        };
      }

      if (
        submittedAnswer &&
        !hasValidRating
      ) {
        return {
          error: {
            code:
              "INVALID_RATING",
            field: questionId,
            message: `The rating for "${question.text}" must be a whole number between 1 and 5.`,
          },
        };
      }

      if (!submittedAnswer) {
        continue;
      }

      normalizedAnswers.push({
        questionId:
          question._id,

        questionKey:
          question.key,

        questionText:
          question.text,

        questionType:
          "rating",

        required:
          Boolean(
            question.required
          ),

        order: index,

        ratingValue,

        textValue: "",
      });

      continue;
    }

    const rawTextValue =
      submittedAnswer
        ?.textValue;

    if (
      rawTextValue !==
        undefined &&
      typeof rawTextValue !==
        "string"
    ) {
      return {
        error: {
          code:
            "INVALID_TEXT_ANSWER",
          field: questionId,
          message: `The answer for "${question.text}" must contain text.`,
        },
      };
    }

    const textValue =
      typeof rawTextValue ===
      "string"
        ? rawTextValue.trim()
        : "";

    if (
      question.required &&
      !textValue
    ) {
      return {
        error: {
          code:
            "REQUIRED_ANSWER_MISSING",
          field: questionId,
          message: `Please answer "${question.text}".`,
        },
      };
    }

    if (
      textValue.length > 1500
    ) {
      return {
        error: {
          code:
            "TEXT_ANSWER_TOO_LONG",
          field: questionId,
          message: `The answer for "${question.text}" cannot exceed 1500 characters.`,
        },
      };
    }

    normalizedAnswers.push({
      questionId:
        question._id,

      questionKey:
        question.key,

      questionText:
        question.text,

      questionType:
        "text",

      required:
        Boolean(
          question.required
        ),

      order: index,

      ratingValue: null,

      textValue,
    });
  }

  return {
    answers:
      normalizedAnswers,
  };
};

const submitFeedback = async (
  req,
  res
) => {
  try {
    const {
      sessionCode,
      participantToken,
      participantName,
      answers,
    } = req.body;

    if (
      typeof sessionCode !==
        "string" ||
      !sessionCode.trim()
    ) {
      return res.status(400).json({
        success: false,
        code:
          "SESSION_CODE_REQUIRED",
        message:
          "Session code is required.",
      });
    }

    if (
      typeof participantToken !==
        "string" ||
      !participantToken.trim()
    ) {
      return res.status(400).json({
        success: false,
        code:
          "PARTICIPANT_TOKEN_REQUIRED",
        message:
          "The anonymous participant identifier is required.",
      });
    }

    if (
      typeof participantName !==
        "string" ||
      !participantName.trim()
    ) {
      return res.status(400).json({
        success: false,
        code:
          "PARTICIPANT_NAME_REQUIRED",
        field:
          "participantName",
        message:
          "Participant name is required.",
      });
    }

    const normalizedName =
      participantName.trim();

    if (
      normalizedName.length >
      100
    ) {
      return res.status(400).json({
        success: false,
        code:
          "PARTICIPANT_NAME_TOO_LONG",
        field:
          "participantName",
        message:
          "Participant name cannot exceed 100 characters.",
      });
    }

    const normalizedSessionCode =
      sessionCode
        .trim()
        .toUpperCase();

    const normalizedParticipantToken =
      participantToken.trim();

    const session =
      await FeedbackSession.findOne({
        sessionCode:
          normalizedSessionCode,
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        code:
          "SESSION_NOT_FOUND",
        message:
          "Feedback session not found.",
      });
    }

    await closeSessionIfExpired(
      session
    );

    if (
      session.status ===
      "waiting"
    ) {
      return res.status(400).json({
        success: false,
        code:
          "SESSION_NOT_STARTED",
        message:
          "This feedback session has not started yet.",
      });
    }

    if (
      session.status !==
      "open"
    ) {
      return res.status(400).json({
        success: false,
        code:
          "SESSION_CLOSED",
        message:
          "This feedback session has ended.",
      });
    }

    if (
      !session.startTime ||
      !session.endTime
    ) {
      return res.status(400).json({
        success: false,
        code:
          "SESSION_NOT_STARTED",
        message:
          "This feedback session has not started yet.",
      });
    }

    if (
      Date.now() >=
      new Date(
        session.endTime
      ).getTime()
    ) {
      session.status = "closed";
      await session.save();

      return res.status(400).json({
        success: false,
        code:
          "SESSION_EXPIRED",
        message:
          "The time for this feedback session has expired.",
      });
    }

    const existingFeedback =
      await Feedback.findOne({
        session:
          session._id,

        participantToken:
          normalizedParticipantToken,
      });

    if (existingFeedback) {
      return res.status(409).json({
        success: false,
        code:
          "FEEDBACK_ALREADY_SUBMITTED",
        message:
          "You have already submitted feedback for this session.",
      });
    }

    const sessionQuestions =
      getSessionQuestions(
        session
      );

    const validationResult =
      validateAndNormalizeAnswers(
        sessionQuestions,
        answers
      );

    if (
      validationResult.error
    ) {
      return res.status(400).json({
        success: false,
        ...validationResult.error,
      });
    }

    const normalizedAnswers =
      validationResult.answers;

    const moderatedTextFields = {
      participantName:
        normalizedName,
    };

    normalizedAnswers.forEach(
      (answer) => {
        if (
          answer.questionType ===
            "text" &&
          answer.textValue
        ) {
          moderatedTextFields[
            `answer_${answer.questionId}`
          ] = answer.textValue;
        }
      }
    );

    const inappropriateField =
      findInappropriateField(
        moderatedTextFields
      );

    if (inappropriateField) {
      const answerId =
        inappropriateField.startsWith(
          "answer_"
        )
          ? inappropriateField.replace(
              "answer_",
              ""
            )
          : inappropriateField;

      return res.status(400).json({
        success: false,
        code:
          "INAPPROPRIATE_CONTENT",
        field: answerId,
        message:
          "Please remove insulting or inappropriate language.",
      });
    }

    const feedback =
      await Feedback.create({
        session:
          session._id,

        participantToken:
          normalizedParticipantToken,

        participantName:
          normalizedName,

        answers:
          normalizedAnswers,
      });

    return res.status(201).json({
      success: true,
      message:
        "Feedback submitted successfully.",
      feedback: {
        id: feedback._id,
        createdAt:
          feedback.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Submit feedback error:",
      error
    );

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        code:
          "FEEDBACK_ALREADY_SUBMITTED",
        message:
          "You have already submitted feedback for this session.",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      const messages =
        Object.values(
          error.errors
        ).map(
          (
            validationError
          ) =>
            validationError.message
        );

      return res.status(400).json({
        success: false,
        code:
          "VALIDATION_ERROR",
        message:
          messages.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message:
        "Server error while submitting feedback.",
    });
  }
};

const getFeedbacksBySession =
  async (req, res) => {
    try {
      const { sessionId } =
        req.params;

      let session =
        await loadProtectedSession(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          code:
            "SESSION_NOT_FOUND",
          message:
            "Feedback session not found.",
        });
      }

      if (
        !canViewSessionResults(
          session,
          req.user
        )
      ) {
        return res.status(403).json({
          success: false,
          code:
            "SESSION_ACCESS_DENIED",
          message:
            "You cannot view another instructor's feedback results.",
        });
      }

      await closeSessionIfExpired(
        session
      );

      session =
        await loadProtectedSession(
          sessionId
        );

      const feedbacks =
        await Feedback.find({
          session: sessionId,
        })
          .select(
            "-participantToken"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,

        session:
          createSessionInformation(
            session
          ),

        total:
          feedbacks.length,

        feedbacks,
      });
    } catch (error) {
      console.error(
        "Get feedbacks by session error:",
        error
      );

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_SESSION_ID",
          message:
            "Invalid session ID.",
        });
      }

      return res.status(500).json({
        success: false,
        code: "SERVER_ERROR",
        message:
          "Server error while loading feedback.",
      });
    }
  };

const getFeedbackSummary =
  async (req, res) => {
    try {
      const { sessionId } =
        req.params;

      let session =
        await loadProtectedSession(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          code:
            "SESSION_NOT_FOUND",
          message:
            "Feedback session not found.",
        });
      }

      if (
        !canViewSessionResults(
          session,
          req.user
        )
      ) {
        return res.status(403).json({
          success: false,
          code:
            "SESSION_ACCESS_DENIED",
          message:
            "You cannot view another instructor's feedback results.",
        });
      }

      await closeSessionIfExpired(
        session
      );

      session =
        await loadProtectedSession(
          sessionId
        );

      const feedbacks =
        await Feedback.find({
          session: sessionId,
        }).sort({
          createdAt: -1,
        });

      const sessionQuestions =
        getSessionQuestions(
          session
        );

      const totalResponses =
        feedbacks.length;

      const ratingQuestions =
        sessionQuestions.filter(
          (question) =>
            question.type ===
            "rating"
        );

      const textQuestions =
        sessionQuestions.filter(
          (question) =>
            question.type ===
            "text"
        );

      const ratingSummaries =
        ratingQuestions.map(
          (question) => ({
            questionId:
              question._id,

            questionKey:
              question.key,

            questionText:
              question.text,

            order:
              question.order,

            required:
              Boolean(
                question.required
              ),

            responseCount: 0,

            average: 0,

            distribution:
              createRatingDistribution(),
          })
        );

      const ratingSummaryMap =
        new Map(
          ratingSummaries.map(
            (summary) => [
              normalizeQuestionId(
                summary.questionId
              ),
              summary,
            ]
          )
        );

      const textSummaries =
        textQuestions.map(
          (question) => ({
            questionId:
              question._id,

            questionKey:
              question.key,

            questionText:
              question.text,

            order:
              question.order,

            required:
              Boolean(
                question.required
              ),

            responseCount: 0,

            responses: [],
          })
        );

      const textSummaryMap =
        new Map(
          textSummaries.map(
            (summary) => [
              normalizeQuestionId(
                summary.questionId
              ),
              summary,
            ]
          )
        );

      feedbacks.forEach(
        (feedback) => {
          (
            feedback.answers ||
            []
          ).forEach(
            (answer) => {
              const questionId =
                normalizeQuestionId(
                  answer.questionId
                );

              if (
                answer.questionType ===
                "rating"
              ) {
                const summary =
                  ratingSummaryMap.get(
                    questionId
                  );

                const ratingValue =
                  Number(
                    answer.ratingValue
                  );

                if (
                  !summary ||
                  !Number.isInteger(
                    ratingValue
                  ) ||
                  ratingValue < 1 ||
                  ratingValue > 5
                ) {
                  return;
                }

                summary.responseCount +=
                  1;

                summary.average +=
                  ratingValue;

                summary.distribution[
                  ratingValue
                ] += 1;

                return;
              }

              if (
                answer.questionType ===
                "text"
              ) {
                const summary =
                  textSummaryMap.get(
                    questionId
                  );

                const textValue =
                  typeof answer.textValue ===
                  "string"
                    ? answer.textValue.trim()
                    : "";

                if (
                  !summary ||
                  !textValue
                ) {
                  return;
                }

                summary.responseCount +=
                  1;

                summary.responses.push({
                  feedbackId:
                    feedback._id,

                  participantName:
                    feedback.participantName,

                  text:
                    textValue,

                  createdAt:
                    feedback.createdAt,
                });
              }
            }
          );
        }
      );

      ratingSummaries.forEach(
        (summary) => {
          if (
            summary.responseCount >
            0
          ) {
            summary.average =
              Number(
                (
                  summary.average /
                  summary.responseCount
                ).toFixed(2)
              );
          } else {
            summary.average = 0;
          }
        }
      );

      const feedbackDetails =
        feedbacks.map(
          (feedback) => {
            const feedbackAnswers =
              (
                feedback.answers ||
                []
              )
                .map(
                  (answer) => ({
                    questionId:
                      answer.questionId,

                    questionKey:
                      answer.questionKey,

                    questionText:
                      answer.questionText,

                    questionType:
                      answer.questionType,

                    required:
                      Boolean(
                        answer.required
                      ),

                    order:
                      answer.order,

                    ratingValue:
                      answer.ratingValue,

                    textValue:
                      answer.textValue,
                  })
                )
                .sort(
                  (
                    firstAnswer,
                    secondAnswer
                  ) =>
                    firstAnswer.order -
                    secondAnswer.order
                );

            const commentCount =
              feedbackAnswers.filter(
                (answer) =>
                  answer.questionType ===
                    "text" &&
                  typeof answer.textValue ===
                    "string" &&
                  answer.textValue.trim()
              ).length;

            return {
              id:
                feedback._id,

              participantName:
                feedback.participantName,

              createdAt:
                feedback.createdAt,

              commentCount,

              hasComments:
                commentCount > 0,

              answers:
                feedbackAnswers,
            };
          }
        );

      const totalComments =
        textSummaries.reduce(
          (
            total,
            summary
          ) =>
            total +
            summary.responseCount,
          0
        );

      const overallAverage =
        ratingSummaries.length >
        0
          ? Number(
              (
                ratingSummaries.reduce(
                  (
                    total,
                    summary
                  ) =>
                    total +
                    summary.average,
                  0
                ) /
                ratingSummaries.length
              ).toFixed(2)
            )
          : 0;

      const answeredRatingSummaries =
        ratingSummaries.filter(
          (summary) =>
            summary.responseCount >
            0
        );

      const highestRatedQuestion =
        answeredRatingSummaries.length >
        0
          ? answeredRatingSummaries.reduce(
              (
                highest,
                current
              ) =>
                current.average >
                highest.average
                  ? current
                  : highest
            )
          : null;

      const lowestRatedQuestion =
        answeredRatingSummaries.length >
        0
          ? answeredRatingSummaries.reduce(
              (
                lowest,
                current
              ) =>
                current.average <
                lowest.average
                  ? current
                  : lowest
            )
          : null;

      return res.status(200).json({
        success: true,

        session:
          createSessionInformation(
            session
          ),

        summary: {
          totalResponses,

          totalComments,

          overallAverage,

          highestRatedQuestion,

          lowestRatedQuestion,

          ratingQuestions:
            ratingSummaries,

          textQuestions:
            textSummaries,

          feedbacks:
            feedbackDetails,
        },
      });
    } catch (error) {
      console.error(
        "Get feedback summary error:",
        error
      );

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_SESSION_ID",
          message:
            "Invalid session ID.",
        });
      }

      return res.status(500).json({
        success: false,
        code: "SERVER_ERROR",
        message:
          "Server error while loading feedback summary.",
      });
    }
  };

const getResponseCount =
  async (req, res) => {
    try {
      const { sessionId } =
        req.params;

      const session =
        await FeedbackSession.findById(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          code:
            "SESSION_NOT_FOUND",
          message:
            "Feedback session not found.",
        });
      }

      if (
        !canViewSessionResults(
          session,
          req.user
        )
      ) {
        return res.status(403).json({
          success: false,
          code:
            "SESSION_ACCESS_DENIED",
          message:
            "You cannot view another instructor's feedback results.",
        });
      }

      await closeSessionIfExpired(
        session
      );

      const totalResponses =
        await Feedback.countDocuments(
          {
            session:
              sessionId,
          }
        );

      return res.status(200).json({
        success: true,
        totalResponses,
        sessionStatus:
          session.status,
      });
    } catch (error) {
      console.error(
        "Get response count error:",
        error
      );

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_SESSION_ID",
          message:
            "Invalid session ID.",
        });
      }

      return res.status(500).json({
        success: false,
        code: "SERVER_ERROR",
        message:
          "Server error while loading response count.",
      });
    }
  };

module.exports = {
  submitFeedback,
  getFeedbacksBySession,
  getFeedbackSummary,
  getResponseCount,
};