import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";
import en from "../translations/en";
import de from "../translations/de";
import LanguageSwitcher from "../components/LanguageSwitcher";
import RatingQuestion from "../components/RatingQuestion";

const getParticipantToken = () => {
  const storageKey = "feedbackParticipantToken";
  let token = localStorage.getItem(storageKey);

  if (!token) {
    token =
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(storageKey, token);
  }

  return token;
};

const normalizeQuestions = (session) => {
  const snapshotQuestions =
    session?.moduleSnapshot?.feedbackQuestions;
  const moduleQuestions =
    session?.module?.feedbackQuestions;

  const source =
    Array.isArray(snapshotQuestions) && snapshotQuestions.length
      ? snapshotQuestions
      : moduleQuestions;

  if (!Array.isArray(source)) {
    return [];
  }

  return [...source]
    .map((question, index) => ({
      id:
        question._id ||
        question.sourceQuestionId ||
        `question_${index}`,
      key: question.key || `question_${index}`,
      text:
        typeof question.text === "string"
          ? question.text.trim()
          : "",
      type: question.type === "text" ? "text" : "rating",
      required:
        question.type === "rating"
          ? question.required !== false
          : Boolean(question.required),
      order:
        typeof question.order === "number"
          ? question.order
          : index,
    }))
    .filter((question) => question.text)
    .sort((a, b) => a.order - b.order);
};

const createEmptyAnswers = (questions) =>
  questions.reduce((result, question) => {
    result[question.id] =
      question.type === "rating" ? 0 : "";
    return result;
  }, {});

function FeedbackPage() {
  const [language, setLanguage] = useState("de");
  const [sessionCode, setSessionCode] = useState("");
  const [session, setSession] = useState(null);
  const [participantName, setParticipantName] = useState("");
  const [answers, setAnswers] = useState({});
  const [loadingSession, setLoadingSession] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const text = language === "de" ? de : en;

  const ui = useMemo(
    () =>
      language === "de"
        ? {
            waitingTitle: "Warten auf den Start",
            waitingMessage:
              "Die Sitzung ist vorbereitet, wurde aber noch nicht gestartet. Bitte warte, bis die Lehrperson die Sitzung startet.",
            waitingHint: "Diese Seite wird automatisch aktualisiert.",
            timeRemaining: "Verbleibende Zeit",
            sessionEnded: "Diese Feedback-Sitzung ist beendet.",
            sessionEndedDescription:
              "Es können keine weiteren Rückmeldungen abgegeben werden.",
            submittedTitle: "Vielen Dank!",
            submittedDescription:
              "Dein Feedback wurde erfolgreich übermittelt.",
            moduleFallback: "Lernbaustein",
            changeSession: "Anderen Sitzungscode verwenden",
            loading: "Sitzung wird geladen...",
            alreadySubmitted:
              "Du hast für diese Sitzung bereits Feedback abgegeben.",
            tokenError:
              "Die anonyme Teilnehmerkennung konnte nicht erstellt werden.",
            nameLabel: "Name",
            namePlaceholder: "Dein Name",
            nameRequired: "Bitte gib deinen Namen ein.",
            requiredAnswers:
              "Bitte beantworte alle Pflichtfragen.",
            noQuestions:
              "Für diese Sitzung wurden keine Feedbackfragen gefunden.",
            answerPlaceholder: "Deine Antwort",
            sessionCode: "Sitzungscode",
          }
        : {
            waitingTitle: "Waiting for the session to start",
            waitingMessage:
              "The session is ready but has not started yet. Please wait for the instructor to start it.",
            waitingHint: "This page updates automatically.",
            timeRemaining: "Time remaining",
            sessionEnded: "This feedback session has ended.",
            sessionEndedDescription:
              "No further feedback can be submitted.",
            submittedTitle: "Thank you!",
            submittedDescription:
              "Your feedback was submitted successfully.",
            moduleFallback: "Learning module",
            changeSession: "Use another session code",
            loading: "Loading session...",
            alreadySubmitted:
              "You have already submitted feedback for this session.",
            tokenError:
              "The anonymous participant identifier could not be created.",
            nameLabel: "Name",
            namePlaceholder: "Your name",
            nameRequired: "Please enter your name.",
            requiredAnswers:
              "Please answer all required questions.",
            noQuestions:
              "No feedback questions were found for this session.",
            answerPlaceholder: "Your answer",
            sessionCode: "Session code",
          },
    [language]
  );

  const questions = useMemo(
    () => normalizeQuestions(session),
    [session]
  );

  const moduleTitle =
    session?.moduleSnapshot?.title ||
    session?.module?.title ||
    ui.moduleFallback;

  const moduleDescription =
    session?.moduleSnapshot?.description ||
    session?.module?.description ||
    "";

  const calculateRemainingSeconds = useCallback((endTime) => {
    if (!endTime) return 0;

    return Math.max(
      0,
      Math.ceil(
        (new Date(endTime).getTime() - Date.now()) / 1000
      )
    );
  }, []);

  const formatCountdown = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  };

  const applyLoadedSession = useCallback(
    (loadedSession) => {
      setSession(loadedSession);
      setSessionCode(loadedSession.sessionCode || "");

      const loadedQuestions = normalizeQuestions(loadedSession);
      setAnswers(createEmptyAnswers(loadedQuestions));

      setRemainingSeconds(
        loadedSession.status === "open" && loadedSession.endTime
          ? calculateRemainingSeconds(loadedSession.endTime)
          : 0
      );
    },
    [calculateRemainingSeconds]
  );

  const loadSessionByCode = useCallback(
    async (
      code,
      { showLoading = true, showErrors = true } = {}
    ) => {
      const normalizedCode = code.trim().toUpperCase();

      if (!normalizedCode) {
        if (showErrors) {
          setError(
            text.requiredSessionCode || "Session code is required."
          );
        }
        return null;
      }

      if (showLoading) setLoadingSession(true);

      try {
        const response = await api.get(
          `/sessions/code/${normalizedCode}`
        );

        applyLoadedSession(response.data.session);
        setError("");
        return response.data.session;
      } catch (requestError) {
        console.error("Load session error:", requestError);

        if (showErrors) {
          setError(
            requestError.response?.data?.message ||
              text.sessionNotFound ||
              "Feedback session not found."
          );
        }

        return null;
      } finally {
        if (showLoading) setLoadingSession(false);
      }
    },
    [applyLoadedSession, text.requiredSessionCode, text.sessionNotFound]
  );

  useEffect(() => {
    const codeFromUrl = new URLSearchParams(
      window.location.search
    ).get("code");

    if (!codeFromUrl) return;

    const normalizedCode = codeFromUrl.trim().toUpperCase();
    setSessionCode(normalizedCode);
    loadSessionByCode(normalizedCode);
  }, [loadSessionByCode]);

  useEffect(() => {
    if (
      !session ||
      session.status !== "waiting" ||
      !session.sessionCode
    ) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      loadSessionByCode(session.sessionCode, {
        showLoading: false,
        showErrors: false,
      });
    }, 2000);

    return () => window.clearInterval(interval);
  }, [loadSessionByCode, session]);

  useEffect(() => {
    if (
      !session ||
      session.status !== "open" ||
      !session.endTime
    ) {
      return undefined;
    }

    let reloaded = false;

    const tick = () => {
      const remaining = calculateRemainingSeconds(session.endTime);
      setRemainingSeconds(remaining);

      if (remaining === 0 && !reloaded) {
        reloaded = true;
        loadSessionByCode(session.sessionCode, {
          showLoading: false,
          showErrors: false,
        });
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);

    return () => window.clearInterval(interval);
  }, [calculateRemainingSeconds, loadSessionByCode, session]);

  const updateAnswer = (questionId, value) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  };

  const validateRequiredAnswers = () =>
    questions.every((question) => {
      if (!question.required) return true;

      const value = answers[question.id];

      if (question.type === "rating") {
        const rating = Number(value);
        return (
          Number.isInteger(rating) &&
          rating >= 1 &&
          rating <= 5
        );
      }

      return typeof value === "string" && value.trim();
    });

  const createAnswersPayload = () =>
    questions.map((question, index) => {
      const value = answers[question.id];

      return {
        questionId: question.id,
        questionKey: question.key,
        questionText: question.text,
        questionType: question.type,
        required: question.required,
        order: index,
        ratingValue:
          question.type === "rating" ? Number(value) : null,
        textValue:
          question.type === "text"
            ? String(value || "").trim()
            : "",
      };
    });

  const handleLoadSession = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitted(false);
    setSession(null);
    await loadSessionByCode(sessionCode);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (session?.status !== "open" || remainingSeconds <= 0) {
      setError(ui.sessionEnded);
      return;
    }

    if (!participantName.trim()) {
      setError(ui.nameRequired);
      return;
    }

    if (!questions.length) {
      setError(ui.noQuestions);
      return;
    }

    if (!validateRequiredAnswers()) {
      setError(ui.requiredAnswers);
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/feedback", {
        sessionCode: session.sessionCode,
        participantToken: getParticipantToken(),
        participantName: participantName.trim(),
        answers: createAnswersPayload(),
      });

      setMessage(
        text.submitSuccess || "Feedback submitted successfully."
      );
      setSubmitted(true);
      setParticipantName("");
      setAnswers(createEmptyAnswers(questions));
    } catch (requestError) {
      const response = requestError.response?.data || {};

      if (response.code === "INAPPROPRIATE_CONTENT") {
        setError(
          response.field === "participantName"
            ? text.inappropriateName ||
                "Please use an appropriate name."
            : text.inappropriateContent ||
                "Please remove inappropriate language."
        );
      } else if (
        response.code === "SESSION_CLOSED" ||
        response.code === "SESSION_EXPIRED"
      ) {
        setError(ui.sessionEnded);
        await loadSessionByCode(session.sessionCode, {
          showLoading: false,
          showErrors: false,
        });
      } else if (response.code === "SESSION_NOT_STARTED") {
        setError(ui.waitingMessage);
      } else if (
        response.code === "FEEDBACK_ALREADY_SUBMITTED"
      ) {
        setError(
          text.feedbackAlreadySubmitted || ui.alreadySubmitted
        );
      } else if (
        response.code === "PARTICIPANT_TOKEN_REQUIRED"
      ) {
        setError(ui.tokenError);
      } else {
        setError(
          response.message ||
            text.submitError ||
            "Feedback could not be submitted."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeSession = () => {
    setSession(null);
    setSessionCode("");
    setSubmitted(false);
    setMessage("");
    setError("");
    setRemainingSeconds(0);
    setParticipantName("");
    setAnswers({});
    window.history.replaceState({}, "", "/feedback");
  };

  return (
    <main className="page">
      <section className="feedback-card">
        <header className="page-header">
          <div>
            <h1>{text.appTitle}</h1>
            {session && <p className="eyebrow">{moduleTitle}</p>}
          </div>

          <LanguageSwitcher
            language={language}
            onChange={setLanguage}
          />
        </header>

        {!session && (
          <form
            className="session-form"
            onSubmit={handleLoadSession}
          >
            <label htmlFor="sessionCode">{text.sessionCode}</label>

            <div className="session-code-row">
              <input
                id="sessionCode"
                value={sessionCode}
                placeholder={text.sessionCodePlaceholder}
                onChange={(event) =>
                  setSessionCode(event.target.value.toUpperCase())
                }
                maxLength={6}
                autoComplete="off"
                disabled={loadingSession}
              />

              <button type="submit" disabled={loadingSession}>
                {loadingSession
                  ? text.loadingSession
                  : text.loadSession}
              </button>
            </div>
          </form>
        )}

        {loadingSession && !session && (
          <div className="alert" role="status">
            {ui.loading}
          </div>
        )}

        {session && (
          <section className="module-information">
            <span>
              {ui.sessionCode}: {session.sessionCode}
            </span>

            <h2>{moduleTitle}</h2>

            {moduleDescription && <p>{moduleDescription}</p>}

            <button
              type="button"
              onClick={handleChangeSession}
              style={styles.changeButton}
            >
              {ui.changeSession}
            </button>
          </section>
        )}

        {session?.status === "waiting" && (
          <StatusCard
            icon="•••"
            title={ui.waitingTitle}
            description={ui.waitingMessage}
            hint={ui.waitingHint}
          />
        )}

        {session?.status === "open" && !submitted && (
          <>
            <section style={styles.timer} aria-live="polite">
              <span style={styles.timerLabel}>{ui.timeRemaining}</span>
              <strong style={styles.timerValue}>
                {formatCountdown(remainingSeconds)}
              </strong>
            </section>

            <form className="feedback-form" onSubmit={handleSubmit}>
              <h2>{text.feedbackTitle}</h2>

              <div className="form-group">
                <label htmlFor="participantName">{ui.nameLabel}</label>

                <input
                  id="participantName"
                  value={participantName}
                  placeholder={ui.namePlaceholder}
                  onChange={(event) =>
                    setParticipantName(event.target.value)
                  }
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </div>

              {questions.map((question) =>
                question.type === "rating" ? (
                  <div
                    key={question.id}
                    style={styles.questionBlock}
                  >
                    <div style={styles.ratingQuestionCard}>
                      <h3 style={styles.questionTitle}>
                        {question.text}
                        {question.required && (
                          <span
                            style={styles.requiredStar}
                            aria-hidden="true"
                          >
                            *
                          </span>
                        )}
                      </h3>

                      <RatingQuestion
                        questionId={question.id}
                        question=""
                        value={Number(answers[question.id]) || 0}
                        onChange={(value) =>
                          updateAnswer(question.id, value)
                        }
                        ratingLabels={text.ratingLabels}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    key={question.id}
                    className="form-group"
                    style={styles.questionBlock}
                  >
                    <label
                      htmlFor={`question-${question.id}`}
                      style={styles.questionTitle}
                    >
                      {question.text}
                      {question.required && (
                        <span
                          style={styles.requiredStar}
                          aria-hidden="true"
                        >
                          *
                        </span>
                      )}
                    </label>

                    <textarea
                      id={`question-${question.id}`}
                      value={answers[question.id] || ""}
                      placeholder={ui.answerPlaceholder}
                      onChange={(event) =>
                        updateAnswer(
                          question.id,
                          event.target.value
                        )
                      }
                      maxLength={1500}
                      required={question.required}
                    />
                  </div>
                )
              )}

              {!questions.length && (
                <div className="alert error" role="alert">
                  {ui.noQuestions}
                </div>
              )}

              <button
                className="submit-button"
                type="submit"
                disabled={
                  submitting ||
                  remainingSeconds <= 0 ||
                  !questions.length
                }
              >
                {submitting ? text.submitting : text.submit}
              </button>
            </form>
          </>
        )}

        {session?.status === "closed" && (
          <StatusCard
            icon="×"
            title={ui.sessionEnded}
            description={ui.sessionEndedDescription}
          />
        )}

        {submitted && (
          <StatusCard
            icon="✓"
            title={ui.submittedTitle}
            description={ui.submittedDescription}
          />
        )}

        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        {message && !submitted && (
          <div className="alert success" role="status">
            {message}
          </div>
        )}
      </section>
    </main>
  );
}

function StatusCard({ icon, title, description, hint }) {
  return (
    <section style={styles.statusCard} aria-live="polite">
      <div style={styles.statusIcon} aria-hidden="true">
        {icon}
      </div>
      <h2 style={styles.statusTitle}>{title}</h2>
      <p style={styles.statusText}>{description}</p>
      {hint && <p style={styles.statusHint}>{hint}</p>}
    </section>
  );
}

const styles = {
  changeButton: {
    padding: 0,
    border: 0,
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: 700,
  },

  statusCard: {
    marginTop: "20px",
    padding: "28px 22px",
    border: "1px solid #d8dfeb",
    borderRadius: "16px",
    background: "#f8fafc",
    textAlign: "center",
  },

  statusIcon: {
    display: "grid",
    placeItems: "center",
    width: "48px",
    height: "48px",
    margin: "0 auto 14px",
    border: "1px solid #d8dfeb",
    borderRadius: "50%",
    color: "#697792",
    fontSize: "1.35rem",
    fontWeight: 800,
  },

  statusTitle: {
    margin: "0 0 8px",
    color: "#172033",
    fontSize: "1.5rem",
  },

  statusText: {
    maxWidth: "520px",
    margin: "0 auto",
    color: "#475569",
    lineHeight: 1.55,
  },

  statusHint: {
    margin: "12px 0 0",
    color: "#697792",
    fontSize: "0.88rem",
    fontWeight: 600,
  },

  timer: {
    position: "sticky",
    top: "16px",
    zIndex: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
    padding: "14px 18px",
    border: "1px solid #d8dfeb",
    borderRadius: "14px",
    background: "rgba(255, 255, 255, 0.96)",
    boxShadow: "0 8px 24px rgba(23, 32, 51, 0.08)",
    backdropFilter: "blur(8px)",
  },

  timerLabel: {
    color: "#5f6f8f",
    fontSize: "0.95rem",
    fontWeight: 700,
  },

  timerValue: {
    color: "#172033",
    fontSize: "1.8rem",
    fontWeight: 800,
    fontVariantNumeric: "tabular-nums",
  },

  questionBlock: {
    position: "relative",
  },

  ratingQuestionCard: {
    padding: 0,
  },

  questionTitle: {
    display: "block",
    margin: "0 0 18px",
    color: "#172033",
    fontSize: "1.45rem",
    fontWeight: 800,
    lineHeight: 1.35,
  },

  requiredStar: {
    marginLeft: "6px",
    color: "#dc2626",
    fontWeight: 900,
  },
};

export default FeedbackPage;
