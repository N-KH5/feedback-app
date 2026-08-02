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

import LanguageSwitcher from "../components/LanguageSwitcher";


const TEXT = {
  de: {
    loginRequired: "Du musst dich anmelden, um Ergebnisse anzusehen.",
    loadError: "Die Feedback-Ergebnisse konnten nicht geladen werden.",
    noExport: "Es gibt keine Antworten zum Exportieren.",
    loading: "Feedback-Ergebnisse werden geladen...",
    unavailable: "Ergebnisse nicht verfügbar",
    backDashboard: "Zurück zum Dashboard",
    evaluation: "Auswertung",
    sessionResults: "Sitzungsergebnisse",
    presentQr: "QR-Code anzeigen",
    exportCsv: "CSV exportieren",
    refresh: "Aktualisieren",
    refreshing: "Wird aktualisiert...",
    module: "Modul",
    sessionCode: "Sitzungscode",
    closed: "Geschlossen",
    waiting: "Wartet",
    open: "Offen",
    responses: "Antworten",
    comments: "Kommentare",
    overallAverage: "Gesamtdurchschnitt",
    highestRated: "Am besten bewertet",
    lowestRated: "Am niedrigsten bewertet",
    responseRate: "Teilnahmequote",
    moreThanExpectedSingular: "Antwort mehr als erwartet",
    moreThanExpectedPlural: "Antworten mehr als erwartet",
    noFeedback: "Noch kein Feedback",
    noFeedbackText:
      "Diese Seite prüft alle fünf Sekunden automatisch auf neue Antworten.",
    ratings: "Bewertungen",
    ratingOverview: "Bewertungsübersicht",
    writtenFeedback: "Schriftliches Feedback",
    individualResponses: "Einzelne Antworten",
    participants: "Teilnehmende",
    responseSingular: "Antwort",
    responsePlural: "Antworten",
    noWrittenResponses: "Keine schriftlichen Antworten.",
    participant: "Teilnehmende Person",
    commentSingular: "Kommentar",
    commentPlural: "Kommentare",
    viewResponse: "Antwort ansehen",
    noWrittenComments: "Keine schriftlichen Kommentare.",
    noResponse: "Keine Antwort",
    deletedModule: "Gelöschtes Modul",
    csvModule: "Modul",
    csvSessionCode: "Sitzungscode",
    csvSessionStatus: "Sitzungsstatus",
    csvExpectedParticipants: "Erwartete Teilnehmende",
    csvTotalResponses: "Anzahl Antworten",
    csvResponseRate: "Teilnahmequote",
    csvParticipant: "Teilnehmende Person",
    csvSubmittedAt: "Abgegeben am",
  },

  en: {
    loginRequired: "You must log in to view results.",
    loadError: "The feedback results could not be loaded.",
    noExport: "There are no responses to export.",
    loading: "Loading feedback results...",
    unavailable: "Results unavailable",
    backDashboard: "Back to dashboard",
    evaluation: "Evaluation",
    sessionResults: "Session results",
    presentQr: "Present QR",
    exportCsv: "Export CSV",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    module: "Module",
    sessionCode: "Session code",
    closed: "Closed",
    waiting: "Waiting",
    open: "Open",
    responses: "Responses",
    comments: "Comments",
    overallAverage: "Overall average",
    highestRated: "Highest rated",
    lowestRated: "Lowest rated",
    responseRate: "response rate",
    moreThanExpectedSingular: "more response than expected",
    moreThanExpectedPlural: "more responses than expected",
    noFeedback: "No feedback yet",
    noFeedbackText:
      "This page automatically checks for new responses every five seconds.",
    ratings: "Ratings",
    ratingOverview: "Rating overview",
    writtenFeedback: "Written feedback",
    individualResponses: "Individual responses",
    participants: "Participants",
    responseSingular: "response",
    responsePlural: "responses",
    noWrittenResponses: "No written responses.",
    participant: "Participant",
    commentSingular: "comment",
    commentPlural: "comments",
    viewResponse: "View response",
    noWrittenComments: "No written comments.",
    noResponse: "No response",
    deletedModule: "Deleted module",
    csvModule: "Module",
    csvSessionCode: "Session Code",
    csvSessionStatus: "Session Status",
    csvExpectedParticipants: "Expected Participants",
    csvTotalResponses: "Total Responses",
    csvResponseRate: "Response Rate",
    csvParticipant: "Participant",
    csvSubmittedAt: "Submitted At",
  },
};

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


const escapeCsvValue = (value) => {
  const normalizedValue =
    value === null || value === undefined
      ? ""
      : String(value);

  return `"${normalizedValue.replace(/"/g, '""')}"`;
};

const sanitizeFileName = (value) => {
  return String(value || "feedback-results")
    .trim()
    .replace(/[^a-zA-Z0-9äöüÄÖÜß_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
};

function SessionResultsPage() {
  const { sessionId } = useParams();

  const [language, setLanguage] =
    useState(
      localStorage.getItem(
        "resultsLanguage"
      ) || "de"
    );

  const t = TEXT[language];

  const handleLanguageChange = (
    nextLanguage
  ) => {
    setLanguage(nextLanguage);

    localStorage.setItem(
      "resultsLanguage",
      nextLanguage
    );
  };

  const [resultData, setResultData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const token =
    localStorage.getItem("token");

  const authHeaders = useMemo(
    () =>
      token
        ? {
            Authorization:
              `Bearer ${token}`,
          }
        : {},
    [token]
  );

  const loadResults = useCallback(
    async ({
      silent = false,
    } = {}) => {
      if (!token) {
        setError(
          t.loginRequired
        );
        setLoading(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response =
          await axios.get(
            `${API_URL}/feedback/session/${sessionId}/summary`,
            {
              headers:
                authHeaders,
            }
          );

        setResultData(
          response.data
        );
      } catch (requestError) {
        console.error(
          "Load session results error:",
          requestError
        );

        setError(
          requestError.response?.data
            ?.message ||
            t.loadError
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      authHeaders,
      sessionId,
      token,
    ]
  );

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  useEffect(() => {
    const refreshInterval =
      window.setInterval(() => {
        loadResults({
          silent: true,
        });
      }, 5000);

    return () => {
      window.clearInterval(
        refreshInterval
      );
    };
  }, [loadResults]);

  const session =
    resultData?.session;

  const summary =
    resultData?.summary;

  const ratingQuestions =
    summary?.ratingQuestions || [];

  const textQuestions =
    summary?.textQuestions || [];

  const participantFeedback =
    summary?.feedbacks || [];

  const moduleTitle =
    session?.moduleSnapshot?.title ||
    session?.module?.title ||
    t.deletedModule;

  const totalResponses =
    summary?.totalResponses ?? 0;

  const expectedParticipants =
    Number(session?.expectedParticipants) > 0
      ? Number(session.expectedParticipants)
      : null;

  const participationRate =
    expectedParticipants
      ? Math.round(
          (totalResponses /
            expectedParticipants) *
            100
        )
      : null;

  const additionalResponses =
    expectedParticipants &&
    totalResponses >
      expectedParticipants
      ? totalResponses -
        expectedParticipants
      : 0;

  const responseDisplay =
    expectedParticipants
      ? `${totalResponses} / ${expectedParticipants}`
      : totalResponses;

  const responseNote =
    expectedParticipants
      ? additionalResponses > 0
        ? `${participationRate}% ${t.responseRate} · ${additionalResponses} ${
            additionalResponses === 1
              ? t.moreThanExpectedSingular
              : t.moreThanExpectedPlural
          }`
        : `${participationRate}% ${t.responseRate}`
      : "";

  const formatDate = (
    dateValue
  ) => {
    if (!dateValue) {
      return "";
    }

    return new Date(
      dateValue
    ).toLocaleString(
      language === "de"
        ? "de-DE"
        : "en-US"
    );
  };


  const handleExportCsv = () => {
    if (
      !summary ||
      !Array.isArray(participantFeedback) ||
      participantFeedback.length === 0
    ) {
      setError(
        t.noExport
      );
      return;
    }

    const snapshotQuestions =
      session?.moduleSnapshot?.feedbackQuestions;

    const orderedQuestions =
      Array.isArray(snapshotQuestions) &&
      snapshotQuestions.length > 0
        ? [...snapshotQuestions].sort(
            (
              firstQuestion,
              secondQuestion
            ) =>
              (firstQuestion.order || 0) -
              (secondQuestion.order || 0)
          )
        : Array.from(
            new Map(
              participantFeedback
                .flatMap(
                  (feedback) =>
                    feedback.answers || []
                )
                .map((answer) => [
                  String(
                    answer.questionId ||
                      answer.questionKey
                  ),
                  {
                    _id:
                      answer.questionId,
                    key:
                      answer.questionKey,
                    text:
                      answer.questionText,
                    type:
                      answer.questionType,
                    order:
                      answer.order || 0,
                  },
                ])
            ).values()
          ).sort(
            (
              firstQuestion,
              secondQuestion
            ) =>
              (firstQuestion.order || 0) -
              (secondQuestion.order || 0)
          );

    const headers = [
      t.csvModule,
      t.csvSessionCode,
      t.csvSessionStatus,
      t.csvExpectedParticipants,
      t.csvTotalResponses,
      t.csvResponseRate,
      t.csvParticipant,
      t.csvSubmittedAt,
      ...orderedQuestions.map(
        (question) =>
          question.text ||
          question.questionText ||
          question.key
      ),
    ];

    const rows =
      participantFeedback.map(
        (feedback) => {
          const answersById =
            new Map();

          const answersByKey =
            new Map();

          (
            feedback.answers || []
          ).forEach((answer) => {
            if (answer.questionId) {
              answersById.set(
                String(
                  answer.questionId
                ),
                answer
              );
            }

            if (answer.questionKey) {
              answersByKey.set(
                answer.questionKey,
                answer
              );
            }
          });

          const answerValues =
            orderedQuestions.map(
              (question) => {
                const answer =
                  answersById.get(
                    String(
                      question._id ||
                        question.questionId ||
                        ""
                    )
                  ) ||
                  answersByKey.get(
                    question.key
                  );

                if (!answer) {
                  return "";
                }

                return answer.questionType ===
                  "rating"
                  ? answer.ratingValue ?? ""
                  : answer.textValue ?? "";
              }
            );

          return [
            moduleTitle,
            session?.sessionCode || "",
            session?.status || "",
            expectedParticipants || "",
            totalResponses,
            participationRate !== null
              ? `${participationRate}%`
              : "",
            feedback.participantName ||
              t.participant,
            formatDate(
              feedback.createdAt
            ),
            ...answerValues,
          ];
        }
      );

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(escapeCsvValue)
          .join(",")
      )
      .join("\r\n");

    const csvBlob = new Blob(
      [
        "\uFEFF",
        csvContent,
      ],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const downloadUrl =
      URL.createObjectURL(
        csvBlob
      );

    const downloadLink =
      document.createElement("a");

    const fileName = `${sanitizeFileName(
      moduleTitle
    )}-${sanitizeFileName(
      session?.sessionCode ||
        "session"
    )}-feedback.csv`;

    downloadLink.href =
      downloadUrl;

    downloadLink.download =
      fileName;

    document.body.appendChild(
      downloadLink
    );

    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(
      downloadUrl
    );
  };

  if (loading) {
    return (
      <main
        style={
          styles.centeredPage
        }
      >
        <p
          style={
            styles.loadingText
          }
        >
          {t.loading}
        </p>
      </main>
    );
  }

  if (
    error &&
    !resultData
  ) {
    return (
      <main
        style={
          styles.centeredPage
        }
      >
        <section
          style={styles.errorCard}
        >
          <h1
            style={
              styles.errorTitle
            }
          >
            {t.unavailable}
          </h1>

          <p
            style={
              styles.errorText
            }
          >
            {error}
          </p>

          <Link
            to="/trainer"
            style={
              styles.primaryLink
            }
          >
            {t.backDashboard}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section
        style={styles.container}
      >
        <header
          style={styles.header}
        >
          <div>
            <p
              style={
                styles.eyebrow
              }
            >
              {t.evaluation}
            </p>

            <h1
              style={styles.title}
            >
              {t.sessionResults}
            </h1>

            <p
              style={
                styles.subtitle
              }
            >
              {moduleTitle}
            </p>
          </div>

          <div
            style={
              styles.headerActions
            }
          >
            <LanguageSwitcher
              language={language}
              onChange={
                handleLanguageChange
              }
            />

            <Link
              to="/trainer"
              style={
                styles.secondaryLink
              }
            >
              {t.backDashboard}
            </Link>

            <Link
              to={`/trainer/sessions/${sessionId}/present`}
              style={
                styles.secondaryLink
              }
            >
              {t.presentQr}
            </Link>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={
                !summary ||
                summary.totalResponses === 0
              }
              style={{
                ...styles.exportButton,
                opacity:
                  !summary ||
                  summary.totalResponses === 0
                    ? 0.55
                    : 1,
              }}
            >
              {t.exportCsv}
            </button>

            <button
              type="button"
              onClick={() =>
                loadResults({
                  silent: true,
                })
              }
              disabled={
                refreshing
              }
              style={
                styles.primaryButton
              }
            >
              {refreshing
                ? t.refreshing
                : t.refresh}
            </button>
          </div>
        </header>

        {error && (
          <p
            role="alert"
            style={
              styles.alertError
            }
          >
            {error}
          </p>
        )}

        <section
          style={
            styles.sessionInformation
          }
        >
          <div>
            <span
              style={
                styles.informationLabel
              }
            >
              {t.module}
            </span>

            <strong
              style={
                styles.moduleName
              }
            >
              {moduleTitle}
            </strong>

            <span
              style={
                styles.sessionCodeLine
              }
            >
              {t.sessionCode}:{" "}
              {session?.sessionCode ||
                "-"}
            </span>
          </div>

          <span
            style={
              session?.status ===
              "closed"
                ? styles.closedBadge
                : session?.status ===
                    "waiting"
                  ? styles.waitingBadge
                  : styles.openBadge
            }
          >
            {session?.status ===
            "closed"
              ? t.closed
              : session?.status ===
                  "waiting"
                ? t.waiting
                : t.open}
          </span>
        </section>

        <section
          style={
            styles.statisticsGrid
          }
        >
          <StatisticCard
            label={t.responses}
            value={
              responseDisplay
            }
            note={
              responseNote
            }
          />

          <StatisticCard
            label={t.comments}
            value={
              summary?.totalComments ??
              0
            }
          />

          <StatisticCard
            label={t.overallAverage}
            value={
              summary?.overallAverage ??
              0
            }
            suffix=" / 5"
          />

          {summary
            ?.highestRatedQuestion && (
            <StatisticCard
              label={t.highestRated}
              value={`${summary.highestRatedQuestion.average} / 5`}
              note={
                summary
                  .highestRatedQuestion
                  .questionText
              }
            />
          )}

          {summary
            ?.lowestRatedQuestion && (
            <StatisticCard
              label={t.lowestRated}
              value={`${summary.lowestRatedQuestion.average} / 5`}
              note={
                summary
                  .lowestRatedQuestion
                  .questionText
              }
            />
          )}
        </section>

        {!summary ||
        summary.totalResponses ===
          0 ? (
          <section
            style={styles.emptyCard}
          >
            <div
              style={
                styles.emptyIcon
              }
            >
              ●
            </div>

            <h2
              style={
                styles.emptyTitle
              }
            >
              {t.noFeedback}
            </h2>

            <p
              style={
                styles.emptyText
              }
            >
              {t.noFeedbackText}
            </p>
          </section>
        ) : (
          <>
            {ratingQuestions.length >
              0 && (
              <section
                style={
                  styles.sectionCard
                }
              >
                <div
                  style={
                    styles.sectionHeader
                  }
                >
                  <div>
                    <p
                      style={
                        styles.sectionEyebrow
                      }
                    >
                      {t.ratings}
                    </p>

                    <h2
                      style={
                        styles.sectionTitle
                      }
                    >
                      {t.ratingOverview}
                    </h2>
                  </div>

                  <span
                    style={
                      styles.participantCount
                    }
                  >
                    {
                      ratingQuestions.length
                    }
                  </span>
                </div>

                <div
                  style={
                    styles.ratingSummaryGrid
                  }
                >
                  {ratingQuestions.map(
                    (
                      question
                    ) => (
                      <RatingSummaryCard
                        key={
                          question.questionId
                        }
                        question={
                          question
                        }
                        text={t}
                      />
                    )
                  )}
                </div>
              </section>
            )}

            {textQuestions.length >
              0 && (
              <section
                style={
                  styles.sectionCard
                }
              >
                <div
                  style={
                    styles.sectionHeader
                  }
                >
                  <div>
                    <p
                      style={
                        styles.sectionEyebrow
                      }
                    >
                      {t.comments}
                    </p>

                    <h2
                      style={
                        styles.sectionTitle
                      }
                    >
                      {t.writtenFeedback}
                    </h2>
                  </div>

                  <span
                    style={
                      styles.participantCount
                    }
                  >
                    {
                      summary.totalComments
                    }
                  </span>
                </div>

                <div
                  style={
                    styles.textQuestionList
                  }
                >
                  {textQuestions.map(
                    (
                      question
                    ) => (
                      <TextQuestionCard
                        key={
                          question.questionId
                        }
                        question={
                          question
                        }
                        formatDate={
                          formatDate
                        }
                        text={t}
                      />
                    )
                  )}
                </div>
              </section>
            )}

            <section
              style={
                styles.participantsCard
              }
            >
              <div
                style={
                  styles.sectionHeader
                }
              >
                <div>
                  <p
                    style={
                      styles.sectionEyebrow
                    }
                  >
                    {t.individualResponses}
                  </p>

                  <h2
                    style={
                      styles.sectionTitle
                    }
                  >
                    {t.participants}
                  </h2>
                </div>

                <span
                  style={
                    styles.participantCount
                  }
                >
                  {
                    participantFeedback.length
                  }
                </span>
              </div>

              <div
                style={
                  styles.participantList
                }
              >
                {participantFeedback.map(
                  (
                    feedback,
                    index
                  ) => (
                    <ParticipantResponseCard
                      key={
                        feedback.id
                      }
                      feedback={
                        feedback
                      }
                      index={
                        index
                      }
                      formatDate={
                        formatDate
                      }
                      text={t}
                    />
                  )
                )}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function StatisticCard({
  label,
  value,
  suffix = "",
  note = "",
}) {
  return (
    <article
      style={styles.statisticCard}
    >
      <span
        style={
          styles.statisticLabel
        }
      >
        {label}
      </span>

      <strong
        style={
          styles.statisticValue
        }
      >
        {value}
        {suffix}
      </strong>

      {note && (
        <span
          style={
            styles.statisticNote
          }
        >
          {note}
        </span>
      )}
    </article>
  );
}

function RatingSummaryCard({
  question,
  text,
}) {
  const maxCount =
    Math.max(
      ...Object.values(
        question.distribution || {}
      ),
      1
    );

  return (
    <article
      style={
        styles.ratingSummaryCard
      }
    >
      <div
        style={
          styles.ratingSummaryHeader
        }
      >
        <div>
          <h3
            style={
              styles.ratingQuestionTitle
            }
          >
            {question.questionText}
          </h3>

          <span
            style={
              styles.responseMeta
            }
          >
            {question.responseCount}{" "}
            {question.responseCount === 1
              ? text.responseSingular
              : text.responsePlural}
          </span>
        </div>

        <strong
          style={
            styles.averageValue
          }
        >
          {question.average} / 5
        </strong>
      </div>

      <div
        style={
          styles.distributionList
        }
      >
        {[5, 4, 3, 2, 1].map(
          (value) => {
            const count =
              question.distribution?.[
                value
              ] || 0;

            const width =
              (count / maxCount) *
              100;

            return (
              <div
                key={value}
                style={
                  styles.distributionRow
                }
              >
                <span
                  style={
                    styles.distributionLabel
                  }
                >
                  {value}
                </span>

                <div
                  style={
                    styles.distributionTrack
                  }
                >
                  <div
                    style={{
                      ...styles.distributionBar,
                      width: `${width}%`,
                    }}
                  />
                </div>

                <span
                  style={
                    styles.distributionCount
                  }
                >
                  {count}
                </span>
              </div>
            );
          }
        )}
      </div>
    </article>
  );
}

function TextQuestionCard({
  question,
  formatDate,
  text,
}) {
  return (
    <article
      style={
        styles.textQuestionCard
      }
    >
      <div
        style={
          styles.textQuestionHeader
        }
      >
        <h3
          style={
            styles.ratingQuestionTitle
          }
        >
          {question.questionText}
        </h3>

        <span
          style={
            styles.commentCountBadge
          }
        >
          {question.responseCount}
        </span>
      </div>

      {question.responses.length ===
      0 ? (
        <p
          style={
            styles.emptyCategoryText
          }
        >
          {text.noWrittenResponses}
        </p>
      ) : (
        <div
          style={
            styles.commentList
          }
        >
          {question.responses.map(
            (response) => (
              <article
                key={`${response.feedbackId}-${response.createdAt}`}
                style={
                  styles.commentItem
                }
              >
                <div
                  style={
                    styles.commentHeader
                  }
                >
                  <strong>
                    {response.participantName ||
                      text.participant}
                  </strong>

                  <span
                    style={
                      styles.commentDate
                    }
                  >
                    {formatDate(
                      response.createdAt
                    )}
                  </span>
                </div>

                <p
                  style={
                    styles.commentText
                  }
                >
                  {response.text}
                </p>
              </article>
            )
          )}
        </div>
      )}
    </article>
  );
}

function ParticipantResponseCard({
  feedback,
  index,
  formatDate,
  text,
}) {
  const ratingAnswers =
    (feedback.answers || []).filter(
      (answer) =>
        answer.questionType ===
        "rating"
    );

  const textAnswers =
    (feedback.answers || []).filter(
      (answer) =>
        answer.questionType ===
          "text" &&
        answer.textValue?.trim()
    );

  return (
    <details
      style={{
        ...styles.participantCard,
        ...(feedback.hasComments
          ? styles.participantCardWithComment
          : {}),
      }}
    >
      <summary
        style={
          styles.participantSummary
        }
      >
        <div
          style={
            styles.participantIdentity
          }
        >
          <span
            style={
              styles.participantAvatar
            }
          >
            {String(
              feedback.participantName
                ?.trim()?.[0] ||
                index + 1
            ).toUpperCase()}
          </span>

          <div>
            <strong
              style={
                styles.participantTitle
              }
            >
              {feedback.participantName ||
                `${text.participant} ${
                  index + 1
                }`}
            </strong>

            <span
              style={
                styles.participantDate
              }
            >
              {formatDate(
                feedback.createdAt
              )}
            </span>
          </div>
        </div>

        <div
          style={
            styles.participantSummaryActions
          }
        >
          {feedback.hasComments && (
            <span
              style={
                styles.commentHighlightBadge
              }
            >
              {feedback.commentCount}{" "}
              {feedback.commentCount ===
              1
                ? text.commentSingular
                : text.commentPlural}
            </span>
          )}

          <span
            style={
              styles.expandText
            }
          >
            {text.viewResponse}
          </span>
        </div>
      </summary>

      <div
        style={
          styles.participantDetails
        }
      >
        {ratingAnswers.length >
          0 && (
          <div
            style={
              styles.individualRatingsGrid
            }
          >
            {ratingAnswers.map(
              (answer) => (
                <div
                  key={
                    answer.questionId
                  }
                  style={
                    styles.individualRatingCard
                  }
                >
                  <span
                    style={
                      styles.individualRatingLabel
                    }
                  >
                    {
                      answer.questionText
                    }
                  </span>

                  <strong
                    style={
                      styles.individualRatingValue
                    }
                  >
                    {
                      answer.ratingValue
                    }{" "}
                    / 5
                  </strong>
                </div>
              )
            )}
          </div>
        )}

        {textAnswers.length >
          0 ? (
          <div
            style={
              styles.answerGrid
            }
          >
            {textAnswers.map(
              (answer) => (
                <AnswerBlock
                  key={
                    answer.questionId
                  }
                  title={
                    answer.questionText
                  }
                  text={
                    answer.textValue
                  }
                  emptyText={
                    text.noResponse
                  }
                />
              )
            )}
          </div>
        ) : (
          <p
            style={
              styles.emptyCategoryText
            }
          >
            {text.noWrittenComments}
          </p>
        )}
      </div>
    </details>
  );
}

function AnswerBlock({
  title,
  text,
  emptyText,
}) {
  return (
    <article
      style={styles.answerBlock}
    >
      <span
        style={
          styles.answerTitle
        }
      >
        {title}
      </span>

      <p
        style={
          styles.answerText
        }
      >
        {text?.trim() ||
          emptyText}
      </p>
    </article>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px",
    background: "#f4f7fb",
    color: "#172033",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },

  container: {
    width: "min(1240px, 100%)",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "24px",
    marginBottom: "28px",
  },

  headerActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },

  eyebrow: {
    margin: "0 0 8px",
    color: "#2563eb",
    fontWeight: 700,
  },

  title: {
    margin: 0,
    fontSize:
      "clamp(2.4rem, 6vw, 4.5rem)",
    lineHeight: 1.05,
  },

  subtitle: {
    margin: "14px 0 0",
    color: "#64748b",
    fontSize: "1.25rem",
  },

  sessionInformation: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "24px",
    padding: "24px",
    borderRadius: "18px",
    background: "#ffffff",
    boxShadow:
      "0 12px 35px rgba(15, 23, 42, 0.07)",
  },

  informationLabel: {
    display: "block",
    marginBottom: "7px",
    color: "#64748b",
    fontWeight: 600,
  },

  moduleName: {
    display: "block",
    fontSize: "1.5rem",
  },

  sessionCodeLine: {
    display: "block",
    marginTop: "8px",
    color: "#64748b",
    fontSize: "0.92rem",
    fontWeight: 600,
  },

  statisticsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },

  statisticCard: {
    padding: "24px",
    borderRadius: "18px",
    background: "#ffffff",
    boxShadow:
      "0 12px 35px rgba(15, 23, 42, 0.07)",
  },

  statisticLabel: {
    display: "block",
    marginBottom: "10px",
    color: "#64748b",
    fontWeight: 600,
  },

  statisticValue: {
    display: "block",
    fontSize: "2rem",
  },

  statisticNote: {
    display: "block",
    marginTop: "8px",
    color: "#64748b",
    fontSize: "0.88rem",
    lineHeight: 1.4,
  },

  sectionCard: {
    marginBottom: "24px",
    padding: "24px",
    borderRadius: "18px",
    background: "#ffffff",
    boxShadow:
      "0 12px 35px rgba(15, 23, 42, 0.07)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "18px",
  },

  sectionEyebrow: {
    margin: "0 0 6px",
    color: "#2563eb",
    fontSize: "0.82rem",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "1.35rem",
  },

  participantCount: {
    display: "grid",
    placeItems: "center",
    minWidth: "42px",
    height: "42px",
    padding: "0 12px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#1d4ed8",
    fontWeight: 800,
  },

  ratingSummaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px",
  },

  ratingSummaryCard: {
    padding: "20px",
    border: "1px solid #dbe4ef",
    borderRadius: "16px",
    background: "#f8fafc",
  },

  ratingSummaryHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "18px",
  },

  ratingQuestionTitle: {
    margin: 0,
    fontSize: "1rem",
    lineHeight: 1.45,
  },

  responseMeta: {
    display: "block",
    marginTop: "6px",
    color: "#64748b",
    fontSize: "0.82rem",
  },

  averageValue: {
    flexShrink: 0,
    color: "#1d4ed8",
    fontSize: "1.25rem",
  },

  distributionList: {
    display: "grid",
    gap: "8px",
  },

  distributionRow: {
    display: "grid",
    gridTemplateColumns:
      "24px 1fr 30px",
    alignItems: "center",
    gap: "10px",
  },

  distributionLabel: {
    color: "#475569",
    fontWeight: 700,
  },

  distributionTrack: {
    height: "10px",
    overflow: "hidden",
    borderRadius: "999px",
    background: "#e2e8f0",
  },

  distributionBar: {
    height: "100%",
    borderRadius: "999px",
    background: "#2563eb",
  },

  distributionCount: {
    color: "#64748b",
    textAlign: "right",
    fontSize: "0.82rem",
    fontWeight: 700,
  },

  textQuestionList: {
    display: "grid",
    gap: "16px",
  },

  textQuestionCard: {
    padding: "20px",
    border: "1px solid #dbe4ef",
    borderRadius: "16px",
    background: "#f8fafc",
  },

  textQuestionHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "14px",
    marginBottom: "14px",
  },

  commentCountBadge: {
    display: "grid",
    placeItems: "center",
    minWidth: "34px",
    height: "34px",
    padding: "0 10px",
    borderRadius: "999px",
    background: "#e0f2fe",
    color: "#0369a1",
    fontWeight: 800,
  },

  participantsCard: {
    marginBottom: "24px",
    padding: "24px",
    borderRadius: "18px",
    background: "#ffffff",
    boxShadow:
      "0 12px 35px rgba(15, 23, 42, 0.07)",
  },

  participantList: {
    display: "grid",
    gap: "12px",
  },

  participantCard: {
    border: "1px solid #dbe4ef",
    borderRadius: "14px",
    background: "#f8fafc",
    overflow: "hidden",
  },

  participantCardWithComment: {
    border: "1px solid #93c5fd",
    background: "#f8fbff",
  },

  participantSummary: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "16px 18px",
    cursor: "pointer",
    listStyle: "none",
  },

  participantIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },

  participantAvatar: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#e2e8f0",
    color: "#334155",
    fontWeight: 800,
  },

  participantTitle: {
    display: "block",
    color: "#172033",
  },

  participantDate: {
    display: "block",
    marginTop: "4px",
    color: "#64748b",
    fontSize: "0.85rem",
  },

  participantSummaryActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent:
      "flex-end",
    gap: "10px",
  },

  commentHighlightBadge: {
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "0.8rem",
    fontWeight: 800,
  },

  expandText: {
    color: "#2563eb",
    fontSize: "0.9rem",
    fontWeight: 700,
  },

  participantDetails: {
    padding: "0 18px 18px",
    borderTop: "1px solid #dbe4ef",
  },

  individualRatingsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginTop: "18px",
  },

  individualRatingCard: {
    padding: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    background: "#ffffff",
  },

  individualRatingLabel: {
    display: "block",
    marginBottom: "7px",
    color: "#64748b",
    fontSize: "0.85rem",
    fontWeight: 600,
  },

  individualRatingValue: {
    fontSize: "1.15rem",
  },

  answerGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "12px",
    marginTop: "14px",
  },

  answerBlock: {
    padding: "14px",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    background: "#eff6ff",
  },

  answerTitle: {
    display: "block",
    marginBottom: "7px",
    color: "#1d4ed8",
    fontSize: "0.85rem",
    fontWeight: 700,
  },

  answerText: {
    margin: 0,
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
  },

  commentList: {
    display: "grid",
    gap: "12px",
  },

  commentItem: {
    padding: "16px",
    border: "1px solid #bfdbfe",
    borderRadius: "13px",
    background: "#eff6ff",
  },

  commentHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "10px",
  },

  commentDate: {
    color: "#64748b",
    fontSize: "0.85rem",
  },

  commentText: {
    margin: 0,
    color: "#334155",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },

  emptyCard: {
    padding: "38px",
    borderRadius: "18px",
    background: "#ffffff",
    boxShadow:
      "0 12px 35px rgba(15, 23, 42, 0.07)",
    textAlign: "center",
  },

  emptyIcon: {
    marginBottom: "12px",
    color: "#cbd5e1",
    fontSize: "1.6rem",
  },

  emptyTitle: {
    margin: "0 0 10px",
  },

  emptyText: {
    margin: 0,
    color: "#64748b",
  },

  emptyCategoryText: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.55,
  },

  openBadge: {
    padding: "7px 13px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 700,
  },

  waitingBadge: {
    padding: "7px 13px",
    borderRadius: "999px",
    background: "#fef3c7",
    color: "#92400e",
    fontWeight: 700,
  },

  closedBadge: {
    padding: "7px 13px",
    borderRadius: "999px",
    background: "#e2e8f0",
    color: "#475569",
    fontWeight: 700,
  },

  exportButton: {
    minHeight: "46px",
    padding: "0 20px",
    border: "1px solid #86efac",
    borderRadius: "10px",
    background: "#f0fdf4",
    color: "#166534",
    cursor: "pointer",
    fontWeight: 800,
  },

  primaryButton: {
    minHeight: "46px",
    padding: "0 20px",
    border: 0,
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 700,
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

  alertError: {
    marginBottom: "20px",
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
    fontFamily:
      "Inter, system-ui, sans-serif",
    color: "#172033",
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
};

export default SessionResultsPage;
