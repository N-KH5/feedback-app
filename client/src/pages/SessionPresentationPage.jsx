import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router";
import axios from "axios";
import QRCode from "react-qr-code";

import LanguageSwitcher from "../components/LanguageSwitcher";

const TEXT = {
  de: {
    loginRequired: "Du musst dich anmelden, um diese Sitzung zu verwalten.",
    loadSessionError: "Die Feedback-Sitzung konnte nicht geladen werden.",
    startPrompt:
      "Feedback-Sitzung starten?\n\nDer gemeinsame Countdown von {duration} Minuten beginnt sofort.",
    startError: "Die Feedback-Sitzung konnte nicht gestartet werden.",
    closePrompt:
      "Sitzung {code} schließen?\n\nTeilnehmende können danach kein Feedback mehr absenden.",
    closeError: "Die Feedback-Sitzung konnte nicht geschlossen werden.",
    copied: "Feedback-Link kopiert.",
    copyError: "Der Feedback-Link konnte nicht kopiert werden.",
    loading: "Feedback-Sitzung wird geladen...",
    unavailable: "Sitzung nicht verfügbar",
    notFound: "Die Feedback-Sitzung wurde nicht gefunden.",
    backDashboard: "Zurück zum Dashboard",
    showStudentResults: "Ergebnisse für Teilnehmende anzeigen",
    viewFullResults: "Vollständige Ergebnisse ansehen",
    feedbackSession: "Feedback-Sitzung",
    scanQr: "Scanne den QR-Code, um die Feedbackseite zu öffnen.",
    sessionCode: "Sitzungscode",
    selectedDuration: "Ausgewählte Dauer",
    minutes: "Minuten",
    waitingMessage:
      "Teilnehmende können den QR-Code bereits scannen. Die Seite wartet, bis du die Sitzung startest.",
    timeRemaining: "Verbleibende Zeit",
    sessionFinished: "Sitzung beendet",
    closedMessage: "Neue Feedback-Antworten werden nicht mehr angenommen.",
    responsesReceived: "Eingegangene Antworten",
    responseRate: "Teilnahmequote",
    starting: "Wird gestartet...",
    startSession: "Sitzung starten",
    closing: "Wird geschlossen...",
    closeNow: "Sitzung jetzt schließen",
    showLink: "Feedback-Link anzeigen",
    copyLink: "Link kopieren",
    openFeedback: "Feedbackseite öffnen",
    waitingBadge: "Wartet auf Start",
    openBadge: "Sitzung aktiv",
    closedBadge: "Sitzung geschlossen",
    exitPresentation: "Präsentation beenden",
    feedbackResults: "Feedback-Ergebnisse",
    overallScore: "Gesamtbewertung der Sitzung",
    outOfFive: "von 5",
    responses: "Antworten",
    highestRated: "Am besten bewertet",
    improvement: "Verbesserungspotenzial",
    responseWord: "Antworten",
    noRatings: "Noch keine Bewertungsergebnisse verfügbar.",
    thankYou: "Vielen Dank für dein Feedback.",
    moduleFallback: "Feedback-Sitzung",
  },

  en: {
    loginRequired: "You must log in to manage this session.",
    loadSessionError: "The feedback session could not be loaded.",
    startPrompt:
      "Start this feedback session?\n\nThe shared {duration}-minute countdown will begin immediately.",
    startError: "The feedback session could not be started.",
    closePrompt:
      "Close session {code}?\n\nParticipants will no longer be able to submit feedback.",
    closeError: "The feedback session could not be closed.",
    copied: "Feedback link copied.",
    copyError: "The feedback link could not be copied.",
    loading: "Loading feedback session...",
    unavailable: "Session unavailable",
    notFound: "The feedback session could not be found.",
    backDashboard: "Back to dashboard",
    showStudentResults: "Show student results",
    viewFullResults: "View full results",
    feedbackSession: "Feedback session",
    scanQr: "Scan the QR code to open the feedback page.",
    sessionCode: "Session code",
    selectedDuration: "Selected duration",
    minutes: "minutes",
    waitingMessage:
      "Participants may scan the QR code now. Their page will wait until you start the session.",
    timeRemaining: "Time remaining",
    sessionFinished: "Session finished",
    closedMessage: "New feedback submissions are no longer accepted.",
    responsesReceived: "Responses received",
    responseRate: "response rate",
    starting: "Starting...",
    startSession: "Start session",
    closing: "Closing...",
    closeNow: "Close session now",
    showLink: "Show feedback link",
    copyLink: "Copy link",
    openFeedback: "Open feedback page",
    waitingBadge: "Waiting to start",
    openBadge: "Session active",
    closedBadge: "Session closed",
    exitPresentation: "Exit presentation",
    feedbackResults: "Feedback results",
    overallScore: "Overall session score",
    outOfFive: "out of 5",
    responses: "Responses",
    highestRated: "Highest rated",
    improvement: "Improvement opportunity",
    responseWord: "responses",
    noRatings: "No rating results are available yet.",
    thankYou: "Thank you for your feedback.",
    moduleFallback: "Feedback session",
  },
};

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const PUBLIC_CLIENT_URL =
  import.meta.env.VITE_PUBLIC_CLIENT_URL ||
  window.location.origin;

function SessionPresentationPage() {
  const { sessionId } = useParams();

  const [language, setLanguage] =
    useState(
      localStorage.getItem(
        "presentationLanguage"
      ) || "de"
    );

  const t = TEXT[language];

  const handleLanguageChange = (
    nextLanguage
  ) => {
    setLanguage(nextLanguage);

    localStorage.setItem(
      "presentationLanguage",
      nextLanguage
    );
  };

  const [session, setSession] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [startingSession, setStartingSession] =
    useState(false);

  const [closingSession, setClosingSession] =
    useState(false);

  const [copyMessage, setCopyMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [remainingSeconds, setRemainingSeconds] =
    useState(0);

  const [responseCount, setResponseCount] =
    useState(0);

  const [summary, setSummary] =
    useState(null);

  const [studentResultsMode, setStudentResultsMode] =
    useState(false);

  const token =
    localStorage.getItem("token");

  const authHeaders = useMemo(() => {
    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const feedbackLink = useMemo(() => {
    if (!session?.sessionCode) {
      return "";
    }

    return `${PUBLIC_CLIENT_URL}/feedback?code=${encodeURIComponent(
      session.sessionCode
    )}`;
  }, [session]);

  const moduleTitle =
    session?.module?.title ||
    session?.moduleSnapshot?.title ||
    t.moduleFallback;

  const moduleDescription =
    session?.module?.description ||
    session?.moduleSnapshot?.description ||
    "";

  const calculateRemainingSeconds =
    useCallback((endTime) => {
      if (!endTime) {
        return 0;
      }

      const difference =
        new Date(endTime).getTime() -
        Date.now();

      return Math.max(
        0,
        Math.ceil(difference / 1000)
      );
    }, []);

  const loadSession = useCallback(
    async ({
      showLoading = false,
    } = {}) => {
      if (!token) {
        setError(
          t.loginRequired
        );

        setLoading(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      try {
        const response = await axios.get(
          `${API_URL}/sessions/${sessionId}`,
          {
            headers: authHeaders,
          }
        );

        const loadedSession =
          response.data.session;

        setSession(loadedSession);

        setRemainingSeconds(
          calculateRemainingSeconds(
            loadedSession.endTime
          )
        );

        setError("");
      } catch (requestError) {
        console.error(
          "Load session error:",
          requestError
        );

        setError(
          requestError.response?.data?.message ||
            t.loadSessionError
        );
      } finally {
        setLoading(false);
      }
    },
    [
      authHeaders,
      calculateRemainingSeconds,
      sessionId,
      token,
    ]
  );

  const loadResponseCount = useCallback(
    async () => {
      if (!token) {
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/feedback/session/${sessionId}/count`,
          {
            headers: authHeaders,
          }
        );

        setResponseCount(
          response.data.totalResponses || 0
        );
      } catch (requestError) {
        console.error(
          "Load response count error:",
          requestError
        );
      }
    },
    [authHeaders, sessionId, token]
  );


  const loadSummary = useCallback(
    async () => {
      if (!token) {
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/feedback/session/${sessionId}/summary`,
          {
            headers: authHeaders,
          }
        );

        setSummary(
          response.data.summary || null
        );
      } catch (requestError) {
        console.error(
          "Load presentation summary error:",
          requestError
        );
      }
    },
    [authHeaders, sessionId, token]
  );

  useEffect(() => {
    loadSession({
      showLoading: true,
    });

    loadResponseCount();
    loadSummary();
  }, [
    loadResponseCount,
    loadSession,
    loadSummary,
  ]);

  useEffect(() => {
    const responseInterval =
      window.setInterval(() => {
        loadResponseCount();
        loadSummary();
      }, 5000);

    return () => {
      window.clearInterval(
        responseInterval
      );
    };
  }, [
    loadResponseCount,
    loadSummary,
  ]);

  useEffect(() => {
    if (
      session?.status !== "open" ||
      !session?.endTime
    ) {
      return undefined;
    }

    const countdownInterval =
      window.setInterval(() => {
        const nextRemainingSeconds =
          calculateRemainingSeconds(
            session.endTime
          );

        setRemainingSeconds(
          nextRemainingSeconds
        );

        if (
          nextRemainingSeconds === 0
        ) {
          window.clearInterval(
            countdownInterval
          );

          loadSession();
          loadSummary();
        }
      }, 1000);

    return () => {
      window.clearInterval(
        countdownInterval
      );
    };
  }, [
    calculateRemainingSeconds,
    loadSession,
    loadSummary,
    session?.endTime,
    session?.status,
  ]);

  const formatCountdown = (
    totalSeconds
  ) => {
    const minutes = Math.floor(
      totalSeconds / 60
    );

    const seconds =
      totalSeconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  const handleStartSession =
    async () => {
      if (
        !session ||
        session.status !== "waiting"
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          t.startPrompt.replace(
            "{duration}",
            session.durationMinutes
          )
        );

      if (!confirmed) {
        return;
      }

      setStartingSession(true);
      setError("");

      try {
        const response =
          await axios.patch(
            `${API_URL}/sessions/${session._id}/start`,
            {},
            {
              headers: authHeaders,
            }
          );

        const startedSession =
          response.data.session;

        setSession(startedSession);

        setRemainingSeconds(
          calculateRemainingSeconds(
            startedSession.endTime
          )
        );

        loadResponseCount();
        loadSummary();
      } catch (requestError) {
        console.error(
          "Start session error:",
          requestError
        );

        setError(
          requestError.response?.data?.message ||
            t.startError
        );
      } finally {
        setStartingSession(false);
      }
    };

  const handleCloseSession =
    async () => {
      if (
        !session ||
        session.status === "closed"
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          t.closePrompt.replace(
            "{code}",
            session.sessionCode
          )
        );

      if (!confirmed) {
        return;
      }

      setClosingSession(true);
      setError("");

      try {
        const response =
          await axios.patch(
            `${API_URL}/sessions/${session._id}/close`,
            {},
            {
              headers: authHeaders,
            }
          );

        setSession(
          response.data.session
        );

        setRemainingSeconds(0);
        loadResponseCount();
        loadSummary();
      } catch (requestError) {
        console.error(
          "Close session error:",
          requestError
        );

        setError(
          requestError.response?.data?.message ||
            t.closeError
        );
      } finally {
        setClosingSession(false);
      }
    };

  const handleCopyLink =
    async () => {
      if (!feedbackLink) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          feedbackLink
        );

        setCopyMessage(
          t.copied
        );
      } catch (clipboardError) {
        console.error(
          "Clipboard error:",
          clipboardError
        );

        setCopyMessage(
          t.copyError
        );
      }
    };


  const handleShowStudentResults =
    async () => {
      await loadSummary();
      setStudentResultsMode(true);
    };

  if (loading) {
    return (
      <main style={styles.centeredPage}>
        <p style={styles.loadingText}>
          {t.loading}
        </p>
      </main>
    );
  }

  if (!session) {
    return (
      <main style={styles.centeredPage}>
        <section style={styles.errorCard}>
          <h1 style={styles.errorTitle}>
            {t.unavailable}
          </h1>

          <p style={styles.errorText}>
            {error ||
              t.notFound}
          </p>

          <Link
            to="/trainer"
            style={styles.primaryLink}
          >
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  if (studentResultsMode) {
    return (
      <StudentResultsView
        moduleTitle={moduleTitle}
        summary={summary}
        responseCount={responseCount}
        session={session}
        text={t}
        onExit={() =>
          setStudentResultsMode(false)
        }
      />
    );
  }

  return (
    <main className="presentation-page" style={styles.page}>
      <section className="presentation-container" style={styles.container}>
        <header className="presentation-topbar" style={styles.topBar}>
          <div className="presentation-topbar-left" style={styles.topBarLeft}>
            <Link
              to="/trainer"
              style={styles.secondaryLink}
            >
              {t.backDashboard}
            </Link>

            <LanguageSwitcher
              language={language}
              onChange={
                handleLanguageChange
              }
            />
          </div>

          <div className="presentation-topbar-actions" style={styles.topBarActions}>
            <button
              type="button"
              onClick={handleShowStudentResults}
              disabled={responseCount === 0}
              style={{
                ...styles.studentResultsButton,
                opacity:
                  responseCount === 0
                    ? 0.55
                    : 1,
              }}
            >
              {t.showStudentResults}
            </button>

            <Link
              to={`/trainer/sessions/${session._id}/results`}
              style={styles.secondaryLink}
            >
              {t.viewFullResults}
            </Link>
          </div>
        </header>

        {error && (
          <p
            role="alert"
            style={styles.alertError}
          >
            {error}
          </p>
        )}

        <section
          style={styles.presentationCard}
        >
          <StatusBadge
            status={session.status}
            text={t}
          />

          <p style={styles.eyebrow}>
            {t.feedbackSession}
          </p>

          <h1 style={styles.title}>
            {moduleTitle}
          </h1>

          {moduleDescription && (
            <p style={styles.description}>
              {moduleDescription}
            </p>
          )}

          <div className="presentation-qr-frame" style={styles.qrFrame}>
            <QRCode
              className="presentation-qr-code"
              value={feedbackLink}
              size={400}
              level="H"
              bgColor="#ffffff"
              fgColor="#111827"
              style={{
                width: "100%",
                height: "auto",
                maxWidth: "400px",
              }}
            />
          </div>

          <p style={styles.scanText}>
            {t.scanQr}
          </p>

          <section
            style={styles.sessionCodeCard}
          >
            <span
              style={
                styles.sessionCodeLabel
              }
            >
              {t.sessionCode}
            </span>

            <strong
              style={styles.sessionCode}
            >
              {session.sessionCode}
            </strong>
          </section>

          <section
            style={styles.timingCard}
          >
            {session.status ===
              "waiting" && (
              <>
                <span
                  style={
                    styles.timingLabel
                  }
                >
                  {t.selectedDuration}
                </span>

                <strong
                  style={
                    styles.durationValue
                  }
                >
                  {
                    session.durationMinutes
                  }{" "}
                  {t.minutes}
                </strong>

                <p
                  style={
                    styles.waitingMessage
                  }
                >
                  {t.waitingMessage}
                </p>
              </>
            )}

            {session.status ===
              "open" && (
              <>
                <span
                  style={
                    styles.timingLabel
                  }
                >
                  {t.timeRemaining}
                </span>

                <strong
                  style={styles.countdown}
                >
                  {formatCountdown(
                    remainingSeconds
                  )}
                </strong>
              </>
            )}

            {session.status ===
              "closed" && (
              <>
                <span
                  style={
                    styles.timingLabel
                  }
                >
                  {t.sessionFinished}
                </span>

                <strong
                  style={
                    styles.closedValue
                  }
                >
                  00:00
                </strong>

                <p
                  style={
                    styles.waitingMessage
                  }
                >
                  {t.closedMessage}
                </p>
              </>
            )}
          </section>

          <section style={styles.responseCard}>
            <span style={styles.responseLabel}>
              {t.responsesReceived}
            </span>

            <strong style={styles.responseValue}>
              {session?.expectedParticipants
                ? `${responseCount} / ${session.expectedParticipants}`
                : responseCount}
            </strong>

            {session?.expectedParticipants && (
              <span style={styles.responseRate}>
                {Math.round(
                  (responseCount /
                    session.expectedParticipants) *
                    100
                )}
                % {t.responseRate}
              </span>
            )}
          </section>

          <div style={styles.mainActions}>
            {session.status ===
              "waiting" && (
              <button
                type="button"
                onClick={
                  handleStartSession
                }
                disabled={
                  startingSession
                }
                style={{
                  ...styles.startButton,
                  opacity:
                    startingSession
                      ? 0.65
                      : 1,
                }}
              >
                {startingSession
                  ? t.starting
                  : t.startSession}
              </button>
            )}

            {session.status ===
              "open" && (
              <button
                type="button"
                onClick={
                  handleCloseSession
                }
                disabled={
                  closingSession
                }
                style={{
                  ...styles.closeButton,
                  opacity:
                    closingSession
                      ? 0.65
                      : 1,
                }}
              >
                {closingSession
                  ? t.closing
                  : t.closeNow}
              </button>
            )}
          </div>

          <details style={styles.linkDetails}>
            <summary
              style={styles.linkSummary}
            >
              {t.showLink}
            </summary>

            <div style={styles.linkContent}>
              <input
                type="text"
                readOnly
                value={feedbackLink}
                style={styles.linkInput}
              />

              <div
                style={styles.linkActions}
              >
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={
                    styles.copyButton
                  }
                >
                  {t.copyLink}
                </button>

                <a
                  href={feedbackLink}
                  target="_blank"
                  rel="noreferrer"
                  style={
                    styles.secondaryLink
                  }
                >
                  {t.openFeedback}
                </a>
              </div>

              {copyMessage && (
                <p
                  style={
                    styles.copyMessage
                  }
                >
                  {copyMessage}
                </p>
              )}
            </div>
          </details>
        </section>
      </section>
    </main>
  );
}

function StudentResultsView({
  moduleTitle,
  summary,
  responseCount,
  session,
  text,
  onExit,
}) {
  const ratingQuestions =
    summary?.ratingQuestions || [];

  const overallAverage =
    Number(summary?.overallAverage || 0);

  const highest =
    summary?.highestRatedQuestion;

  const lowest =
    summary?.lowestRatedQuestion;

  return (
    <main className="student-results-page" style={styles.studentResultsPage}>
      <button
        type="button"
        onClick={onExit}
        style={styles.exitStudentResultsButton}
      >
        {text.exitPresentation}
      </button>

      <section className="student-results-container" style={styles.studentResultsContainer}>
        <p style={styles.studentResultsEyebrow}>
          {text.feedbackResults}
        </p>

        <h1 style={styles.studentResultsTitle}>
          {moduleTitle}
        </h1>

        <section className="student-overall-score-card" style={styles.overallScoreCard}>
          <span style={styles.overallScoreLabel}>
            {text.overallScore}
          </span>

          <strong style={styles.overallScoreValue}>
            {overallAverage.toFixed(2)}
          </strong>

          <span style={styles.overallScoreScale}>
            {text.outOfFive}
          </span>
        </section>

        <section className="student-summary-grid" style={styles.publicSummaryGrid}>
          <PublicSummaryCard
            label={text.responses}
            value={
              session?.expectedParticipants
                ? `${responseCount} / ${session.expectedParticipants}`
                : responseCount
            }
            note={
              session?.expectedParticipants
                ? `${Math.round(
                    (responseCount /
                      session.expectedParticipants) *
                      100
                  )}% ${text.responseRate}`
                : ""
            }
          />

          {highest && (
            <PublicSummaryCard
              label={text.highestRated}
              value={`${highest.average} / 5`}
              note={highest.questionText}
            />
          )}

          {lowest && (
            <PublicSummaryCard
              label={text.improvement}
              value={`${lowest.average} / 5`}
              note={lowest.questionText}
            />
          )}
        </section>

        {ratingQuestions.length > 0 ? (
          <section className="student-ratings-grid" style={styles.publicRatingsGrid}>
            {ratingQuestions.map((question) => (
              <article
                key={question.questionId}
                style={styles.publicRatingCard}
              >
                <h2 style={styles.publicRatingTitle}>
                  {question.questionText}
                </h2>

                <strong style={styles.publicRatingValue}>
                  {question.average} / 5
                </strong>

                <span style={styles.publicRatingResponses}>
                  {question.responseCount} {text.responseWord}
                </span>
              </article>
            ))}
          </section>
        ) : (
          <section style={styles.publicEmptyCard}>
            {text.noRatings}
          </section>
        )}

        <p style={styles.publicThankYou}>
          {text.thankYou}
        </p>
      </section>
    </main>
  );
}

function PublicSummaryCard({
  label,
  value,
  note = "",
}) {
  return (
    <article style={styles.publicSummaryCard}>
      <span style={styles.publicSummaryLabel}>
        {label}
      </span>

      <strong style={styles.publicSummaryValue}>
        {value}
      </strong>

      {note && (
        <span style={styles.publicSummaryNote}>
          {note}
        </span>
      )}
    </article>
  );
}

function StatusBadge({
  status,
  text,
}) {
  const labels = {
    waiting:
      text.waitingBadge,
    open:
      text.openBadge,
    closed:
      text.closedBadge,
  };

  const badgeStyle =
    status === "waiting"
      ? styles.waitingBadge
      : status === "open"
        ? styles.openBadge
        : styles.closedBadge;

  return (
    <span style={badgeStyle}>
      {labels[status] || status}
    </span>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background: "#f4f7fb",
    color: "#172033",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },

  container: {
    width: "min(1200px, 100%)",
    margin: "0 auto",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "18px",
  },

  topBarLeft: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },

  topBarActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },

  studentResultsButton: {
    minHeight: "46px",
    padding: "0 20px",
    border: 0,
    borderRadius: "10px",
    background: "#172033",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 800,
  },

  presentationCard: {
    width: "min(920px, 100%)",
    margin: "0 auto",
    padding: "40px",
    borderRadius: "28px",
    background: "#ffffff",
    boxShadow:
      "0 18px 55px rgba(15, 23, 42, 0.1)",
    textAlign: "center",
  },

  eyebrow: {
    margin: "22px 0 8px",
    color: "#2563eb",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  title: {
    margin: 0,
    fontSize:
      "clamp(2.4rem, 7vw, 5rem)",
    lineHeight: 1.05,
  },

  description: {
    maxWidth: "700px",
    margin: "16px auto 0",
    color: "#64748b",
    fontSize: "1.1rem",
    lineHeight: 1.6,
  },

  qrFrame: {
    display: "inline-flex",
    marginTop: "30px",
    padding: "28px",
    border: "1px solid #dbe4f0",
    borderRadius: "22px",
    background: "#ffffff",
  },

  scanText: {
    margin: "18px 0 0",
    color: "#475569",
    fontSize: "1.1rem",
  },

  sessionCodeCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    maxWidth: "650px",
    margin: "26px auto 0",
    padding: "18px 22px",
    borderRadius: "16px",
    background: "#eff6ff",
  },

  sessionCodeLabel: {
    color: "#475569",
    fontWeight: 700,
  },

  sessionCode: {
    color: "#1d4ed8",
    fontSize: "2rem",
    letterSpacing: "0.18em",
  },

  timingCard: {
    maxWidth: "650px",
    margin: "18px auto 0",
    padding: "22px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    background: "#f8fafc",
  },

  timingLabel: {
    display: "block",
    marginBottom: "8px",
    color: "#64748b",
    fontWeight: 700,
  },

  durationValue: {
    fontSize: "2rem",
  },

  countdown: {
    display: "block",
    fontSize:
      "clamp(3rem, 10vw, 6rem)",
    lineHeight: 1,
    color: "#166534",
    fontVariantNumeric:
      "tabular-nums",
  },

  closedValue: {
    display: "block",
    fontSize: "3rem",
    color: "#64748b",
  },

  responseCard: {
    maxWidth: "650px",
    margin: "18px auto 0",
    padding: "20px 22px",
    border: "1px solid #dbe4f0",
    borderRadius: "16px",
    background: "#ffffff",
  },

  responseLabel: {
    display: "block",
    color: "#64748b",
    fontWeight: 700,
  },

  responseValue: {
    display: "block",
    marginTop: "6px",
    color: "#172033",
    fontSize: "3.6rem",
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
  },

  responseRate: {
    display: "block",
    marginTop: "10px",
    color: "#64748b",
    fontSize: "1rem",
    fontWeight: 700,
  },

  waitingMessage: {
    maxWidth: "560px",
    margin: "14px auto 0",
    color: "#64748b",
    lineHeight: 1.6,
  },

  mainActions: {
    display: "flex",
    justifyContent: "center",
    marginTop: "24px",
  },

  startButton: {
    minHeight: "58px",
    padding: "0 34px",
    border: 0,
    borderRadius: "14px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "1.15rem",
    fontWeight: 800,
    boxShadow:
      "0 12px 25px rgba(37, 99, 235, 0.25)",
  },

  closeButton: {
    minHeight: "54px",
    padding: "0 28px",
    border: "1px solid #fed7aa",
    borderRadius: "13px",
    background: "#fff7ed",
    color: "#c2410c",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 800,
  },

  waitingBadge: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "#fef3c7",
    color: "#92400e",
    fontWeight: 800,
  },

  openBadge: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 800,
  },

  closedBadge: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "#e2e8f0",
    color: "#475569",
    fontWeight: 800,
  },

  linkDetails: {
    maxWidth: "720px",
    margin: "26px auto 0",
    textAlign: "left",
  },

  linkSummary: {
    cursor: "pointer",
    color: "#475569",
    fontWeight: 700,
    textAlign: "center",
  },

  linkContent: {
    marginTop: "16px",
  },

  linkInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "0.95rem",
  },

  linkActions: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "14px",
  },

  copyButton: {
    minHeight: "46px",
    padding: "0 20px",
    border: 0,
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 700,
  },

  secondaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "46px",
    padding: "0 20px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#172033",
    textDecoration: "none",
    fontWeight: 700,
  },

  copyMessage: {
    margin: "12px 0 0",
    color: "#166534",
    fontWeight: 700,
    textAlign: "center",
  },

  alertError: {
    width: "min(920px, 100%)",
    boxSizing: "border-box",
    margin: "0 auto 18px",
    padding: "14px 16px",
    borderRadius: "12px",
    background: "#fee2e2",
    color: "#991b1b",
  },

  centeredPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background: "#f4f7fb",
    color: "#172033",
    fontFamily:
      "Inter, system-ui, sans-serif",
  },

  loadingText: {
    color: "#64748b",
    fontSize: "1.1rem",
  },

  errorCard: {
    width: "min(560px, 100%)",
    padding: "36px",
    borderRadius: "20px",
    background: "#ffffff",
    boxShadow:
      "0 16px 45px rgba(15, 23, 42, 0.1)",
    textAlign: "center",
  },

  errorTitle: {
    margin: "0 0 14px",
  },

  errorText: {
    margin: "0 0 22px",
    color: "#64748b",
    lineHeight: 1.6,
  },

  studentResultsPage: {
    minHeight: "100vh",
    padding: "28px",
    background: "#f4f7fb",
    color: "#172033",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },

  exitStudentResultsButton: {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 20,
    minHeight: "44px",
    padding: "0 18px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.95)",
    color: "#172033",
    cursor: "pointer",
    fontWeight: 700,
  },

  studentResultsContainer: {
    width: "min(1400px, 100%)",
    margin: "0 auto",
    textAlign: "center",
  },

  studentResultsEyebrow: {
    margin: "34px 0 10px",
    color: "#2563eb",
    fontWeight: 900,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },

  studentResultsTitle: {
    margin: 0,
    fontSize: "clamp(2.8rem, 7vw, 6rem)",
    lineHeight: 1.02,
  },

  overallScoreCard: {
    width: "min(520px, 100%)",
    margin: "34px auto 0",
    padding: "34px",
    boxSizing: "border-box",
    borderRadius: "28px",
    background: "#ffffff",
    boxShadow:
      "0 20px 55px rgba(15, 23, 42, 0.11)",
  },

  overallScoreLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "1.05rem",
    fontWeight: 800,
  },

  overallScoreValue: {
    display: "block",
    marginTop: "8px",
    color: "#172033",
    fontSize: "clamp(4rem, 12vw, 8rem)",
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
  },

  overallScoreScale: {
    display: "block",
    marginTop: "8px",
    color: "#64748b",
    fontSize: "1.2rem",
    fontWeight: 700,
  },

  publicSummaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
    marginTop: "24px",
  },

  publicSummaryCard: {
    padding: "24px",
    borderRadius: "20px",
    background: "#ffffff",
    boxShadow:
      "0 12px 35px rgba(15, 23, 42, 0.08)",
  },

  publicSummaryLabel: {
    display: "block",
    color: "#64748b",
    fontWeight: 800,
  },

  publicSummaryValue: {
    display: "block",
    marginTop: "10px",
    fontSize: "2.4rem",
  },

  publicSummaryNote: {
    display: "block",
    marginTop: "8px",
    color: "#475569",
    lineHeight: 1.45,
  },

  publicRatingsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
    marginTop: "24px",
  },

  publicRatingCard: {
    padding: "28px",
    borderRadius: "22px",
    background: "#ffffff",
    boxShadow:
      "0 12px 35px rgba(15, 23, 42, 0.08)",
    textAlign: "left",
  },

  publicRatingTitle: {
    margin: 0,
    color: "#334155",
    fontSize: "1.2rem",
    lineHeight: 1.45,
  },

  publicRatingValue: {
    display: "block",
    marginTop: "22px",
    color: "#2563eb",
    fontSize: "2.5rem",
  },

  publicRatingResponses: {
    display: "block",
    marginTop: "8px",
    color: "#64748b",
    fontWeight: 700,
  },

  publicEmptyCard: {
    marginTop: "24px",
    padding: "34px",
    borderRadius: "20px",
    background: "#ffffff",
    color: "#64748b",
    fontSize: "1.1rem",
  },

  publicThankYou: {
    margin: "34px 0 16px",
    color: "#475569",
    fontSize: "1.5rem",
    fontWeight: 800,
  },

  primaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "46px",
    padding: "0 20px",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 700,
  },
};

export default SessionPresentationPage;