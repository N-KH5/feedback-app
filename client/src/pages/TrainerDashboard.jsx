import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useNavigate,
} from "react-router";
import axios from "axios";

import LanguageSwitcher from "../components/LanguageSwitcher";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const DEFAULT_QUESTIONS = {
  de: [
    {
      key: "overall",
      text:
        "Wie zufrieden bist du insgesamt mit der heutigen Sitzung?",
      type: "rating",
      required: true,
      isDefault: true,
    },
    {
      key: "trainer",
      text:
        "Wie bewertest du die Lehrperson?",
      type: "rating",
      required: true,
      isDefault: true,
    },
    {
      key: "content",
      text:
        "Wie bewertest du die Inhalte?",
      type: "rating",
      required: true,
      isDefault: true,
    },
    {
      key: "pace",
      text:
        "Wie bewertest du das Lerntempo?",
      type: "rating",
      required: true,
      isDefault: true,
    },
    {
      key: "keep",
      text:
        "Was sollte beibehalten werden?",
      type: "text",
      required: false,
      isDefault: true,
    },
    {
      key: "stop",
      text:
        "Was sollte nicht mehr gemacht werden?",
      type: "text",
      required: false,
      isDefault: true,
    },
    {
      key: "start",
      text:
        "Was sollte begonnen oder verbessert werden?",
      type: "text",
      required: false,
      isDefault: true,
    },
    {
      key: "additionalComment",
      text:
        "Zusätzliche Anmerkungen",
      type: "text",
      required: false,
      isDefault: true,
    },
  ],

  en: [
    {
      key: "overall",
      text:
        "Overall, how satisfied are you with today's session?",
      type: "rating",
      required: true,
      isDefault: true,
    },
    {
      key: "trainer",
      text:
        "How would you rate the instructor?",
      type: "rating",
      required: true,
      isDefault: true,
    },
    {
      key: "content",
      text:
        "How would you rate the content?",
      type: "rating",
      required: true,
      isDefault: true,
    },
    {
      key: "pace",
      text:
        "How would you rate the pace?",
      type: "rating",
      required: true,
      isDefault: true,
    },
    {
      key: "keep",
      text:
        "What should be kept?",
      type: "text",
      required: false,
      isDefault: true,
    },
    {
      key: "stop",
      text:
        "What should be stopped?",
      type: "text",
      required: false,
      isDefault: true,
    },
    {
      key: "start",
      text:
        "What should be started or improved?",
      type: "text",
      required: false,
      isDefault: true,
    },
    {
      key: "additionalComment",
      text:
        "Additional comments",
      type: "text",
      required: false,
      isDefault: true,
    },
  ],
};

const cloneDefaultQuestions = (
  language = "de"
) => {
  return DEFAULT_QUESTIONS[
    language
  ].map((question, index) => ({
    ...question,
    order: index,
  }));
};

const createQuestionKey = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return `question_${crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 12)}`;
  }

  return `question_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const normalizeQuestionArray = (
  questions,
  language = "de"
) => {
  if (Array.isArray(questions)) {
    return questions.map(
      (question, index) => ({
        key:
          question.key ||
          createQuestionKey(),
        text:
          question.text || "",
        type:
          question.type === "text"
            ? "text"
            : "rating",
        required:
          question.type === "text"
            ? Boolean(
                question.required
              )
            : question.required !==
              false,
        order: index,
        isDefault:
          Boolean(
            question.isDefault
          ),
      })
    );
  }

  if (
    questions &&
    typeof questions === "object"
  ) {
    return cloneDefaultQuestions(
      language
    ).map(
      (question, index) => ({
        ...question,
        text:
          questions[
            question.key
          ] || question.text,
        order: index,
      })
    );
  }

  return cloneDefaultQuestions(
    language
  );
};

const TEXT = {
  de: {
    appName: "Feedback",
    dashboard: "Dashboard",
    welcome: "Willkommen",
    userFallback: "Benutzer",
    openFeedbackForm: "Feedbackformular öffnen",
    logout: "Abmelden",

    createModule: "Modul erstellen",
    editModule: "Modul bearbeiten",
    cancelEditing: "Bearbeitung abbrechen",
    moduleTitle: "Modulname",
    description: "Beschreibung",
    optional: "optional",
    optionalDescription: "Optionale Beschreibung",

    feedbackQuestions: "Feedbackfragen",
    configuredQuestions: "Fragen",
    ratingShort: "Bewertung",
    textShort: "Text",
    showQuestions: "Fragen anzeigen",
    hideQuestions: "Fragen ausblenden",
    ratingQuestionsGroup: "Bewertungsfragen (Pflicht)",
    textQuestionsGroup: "Freitextfragen (optional)",
    feedbackQuestionsHelp:
      "Standardfragen sind vorbereitet. Du kannst sie bearbeiten, löschen oder weitere Fragen hinzufügen.",
    addRatingQuestion:
      "Bewertungsfrage hinzufügen",
    addTextQuestion:
      "Freitextfrage hinzufügen",
    questionPlaceholder:
      "Fragetext eingeben",
    requiredQuestion:
      "Pflicht",
    optionalQuestion:
      "Optional",
    moveUp:
      "Nach oben",
    moveDown:
      "Nach unten",
    removeQuestion:
      "Frage löschen",
    atLeastOneQuestion:
      "Mindestens eine Feedbackfrage ist erforderlich.",
    emptyQuestion:
      "Alle Feedbackfragen benötigen einen Fragetext.",
    maxQuestions:
      "Es sind höchstens 30 Feedbackfragen möglich.",
    resetDefaults: "Standardfragen wiederherstellen",
    overallQuestion: "Frage zur Gesamtbewertung",
    trainerQuestion: "Frage zur Lehrperson",
    contentQuestion: "Frage zu den Inhalten",
    paceQuestion: "Frage zum Lerntempo",
    keepQuestion: "Beibehalten-Frage",
    stopQuestion: "Stoppen-Frage",
    startQuestion: "Start- oder Verbesserungsfrage",
    additionalQuestion: "Frage für zusätzliche Anmerkungen",

    materials: "Lernmaterialien",
    materialHint:
      "PDF, JPG, PNG oder WEBP. Maximal 10 Dateien, jeweils höchstens 10 MB.",
    currentMaterials: "Aktuelle Materialien",
    open: "Öffnen",
    remove: "Entfernen",
    undoRemove: "Entfernen rückgängig machen",

    moduleActive: "Modul ist aktiv",
    saving: "Wird gespeichert...",
    saveChanges: "Änderungen speichern",
    createModuleButton: "Modul erstellen",

    yourModules: "Deine Module",
    loadingModules: "Module werden geladen...",
    noModules: "Noch keine Module",
    noModulesMessage:
      "Erstelle oben dein erstes Modul.",
    active: "Aktiv",
    inactive: "Inaktiv",
    noDescription: "Keine Beschreibung",
    image: "Bild",
    edit: "Bearbeiten",
    delete: "Löschen",
    deleting: "Wird gelöscht...",

    createSession: "Feedback-Sitzung erstellen",
    module: "Modul",
    duration: "Dauer",
    minutes: "Minuten",
    expectedParticipants:
      "Erwartete Teilnehmende",
    expectedParticipantsOptional:
      "optional",
    expectedParticipantsPlaceholder:
      "z. B. 25",
    expectedParticipantsHint:
      "Leer lassen, wenn keine Teilnahmequote angezeigt werden soll.",
    expectedParticipantsInvalid:
      "Die erwartete Teilnehmerzahl muss zwischen 1 und 10000 liegen.",
    expectedParticipantsShort:
      "Erwartet",
    noActiveModules:
      "Keine aktiven Module verfügbar",
    creating: "Wird erstellt...",
    createAndPresent:
      "Erstellen und QR-Code anzeigen",

    sessionHistory: "Sitzungsverlauf",
    refresh: "Aktualisieren",
    refreshing: "Wird aktualisiert...",
    loadingSessions:
      "Sitzungen werden geladen...",
    noSessions: "Noch keine Sitzungen",
    noSessionsMessage:
      "Erstelle oben eine Feedback-Sitzung.",

    waitingSessions: "Wartende Sitzungen",
    openSessions: "Offene Sitzungen",
    closedSessions: "Geschlossene Sitzungen",
    noWaiting: "Keine wartenden Sitzungen.",
    noOpen: "Keine offenen Sitzungen.",
    noClosed: "Keine geschlossenen Sitzungen.",

    code: "Code",
    created: "Erstellt",
    presentQr: "QR-Code anzeigen",
    viewResults: "Ergebnisse ansehen",
    closeSession: "Sitzung schließen",
    closing: "Wird geschlossen...",
    deletePermanently: "Endgültig löschen",
    waiting: "Wartet",
    openStatus: "Offen",
    closed: "Geschlossen",

    loginRequired:
      "Du musst dich zuerst anmelden.",
    loadModulesError:
      "Die Module konnten nicht geladen werden.",
    loadSessionsError:
      "Die Feedback-Sitzungen konnten nicht geladen werden.",
    fileTooLarge:
      "ist größer als 10 MB.",
    maxFiles:
      "Du kannst höchstens 10 Dateien gleichzeitig hochladen.",
    titleRequired:
      "Bitte gib einen Modulnamen ein.",
    moduleUpdated:
      "Modul erfolgreich aktualisiert.",
    moduleCreated:
      "Modul erfolgreich erstellt.",
    moduleSaveError:
      "Das Modul konnte nicht gespeichert werden.",
    moduleDeletePrompt:
      "Möchtest du dieses Modul löschen?",
    sessionsRemain:
      "Bestehende Sitzungen bleiben im Verlauf erhalten.",
    moduleDeleted:
      "Modul erfolgreich gelöscht.",
    moduleDeleteError:
      "Das Modul konnte nicht gelöscht werden.",
    selectModule:
      "Bitte wähle ein aktives Modul aus.",
    sessionCreateError:
      "Die Feedback-Sitzung konnte nicht erstellt werden.",
    closePrompt:
      "Möchtest du diese Sitzung schließen?",
    noMoreSubmissions:
      "Teilnehmende können danach kein Feedback mehr absenden.",
    sessionClosed:
      "Feedback-Sitzung erfolgreich geschlossen.",
    sessionCloseError:
      "Die Feedback-Sitzung konnte nicht geschlossen werden.",
    permanentDeletePrompt:
      "Möchtest du diese Sitzung endgültig löschen?",
    feedbackDeleted:
      "Alle Feedback-Antworten dieser Sitzung werden ebenfalls gelöscht.",
    sessionDeleted:
      "Feedback-Sitzung endgültig gelöscht.",
    sessionDeleteError:
      "Die Feedback-Sitzung konnte nicht gelöscht werden.",
    deletedModule: "Gelöschtes Modul",
  },

  en: {
    appName: "Feedback",
    dashboard: "Dashboard",
    welcome: "Welcome",
    userFallback: "User",
    openFeedbackForm: "Open feedback form",
    logout: "Log out",

    createModule: "Create a module",
    editModule: "Edit module",
    cancelEditing: "Cancel editing",
    moduleTitle: "Module title",
    description: "Description",
    optional: "optional",
    optionalDescription: "Optional description",

    feedbackQuestions: "Feedback questions",
    configuredQuestions: "questions",
    ratingShort: "rating",
    textShort: "text",
    showQuestions: "Show questions",
    hideQuestions: "Hide questions",
    ratingQuestionsGroup: "Rating questions (required)",
    textQuestionsGroup: "Text questions (optional)",
    feedbackQuestionsHelp:
      "Standard questions are prepared. You can edit, delete or add more questions.",
    addRatingQuestion:
      "Add rating question",
    addTextQuestion:
      "Add text question",
    questionPlaceholder:
      "Enter question text",
    requiredQuestion:
      "Required",
    optionalQuestion:
      "Optional",
    moveUp:
      "Move up",
    moveDown:
      "Move down",
    removeQuestion:
      "Delete question",
    atLeastOneQuestion:
      "At least one feedback question is required.",
    emptyQuestion:
      "Every feedback question needs text.",
    maxQuestions:
      "A maximum of 30 feedback questions is allowed.",
    resetDefaults: "Reset to defaults",
    overallQuestion: "Overall rating question",
    trainerQuestion: "Instructor rating question",
    contentQuestion: "Content rating question",
    paceQuestion: "Pace rating question",
    keepQuestion: "Keep question",
    stopQuestion: "Stop question",
    startQuestion:
      "Start or improvement question",
    additionalQuestion:
      "Additional comment question",

    materials: "Learning materials",
    materialHint:
      "PDF, JPG, PNG or WEBP. Maximum 10 files, 10 MB per file.",
    currentMaterials: "Current materials",
    open: "Open",
    remove: "Remove",
    undoRemove: "Undo remove",

    moduleActive: "Module is active",
    saving: "Saving...",
    saveChanges: "Save changes",
    createModuleButton: "Create module",

    yourModules: "Your modules",
    loadingModules: "Loading modules...",
    noModules: "No modules yet",
    noModulesMessage:
      "Create your first module above.",
    active: "Active",
    inactive: "Inactive",
    noDescription: "No description",
    image: "Image",
    edit: "Edit",
    delete: "Delete",
    deleting: "Deleting...",

    createSession: "Create feedback session",
    module: "Module",
    duration: "Duration",
    minutes: "minutes",
    expectedParticipants:
      "Expected participants",
    expectedParticipantsOptional:
      "optional",
    expectedParticipantsPlaceholder:
      "e.g. 25",
    expectedParticipantsHint:
      "Leave empty if you do not want to display a participation rate.",
    expectedParticipantsInvalid:
      "Expected participants must be between 1 and 10000.",
    expectedParticipantsShort:
      "Expected",
    noActiveModules:
      "No active modules available",
    creating: "Creating...",
    createAndPresent:
      "Create and present QR",

    sessionHistory: "Session history",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    loadingSessions: "Loading sessions...",
    noSessions: "No sessions yet",
    noSessionsMessage:
      "Create a feedback session above.",

    waitingSessions: "Waiting sessions",
    openSessions: "Open sessions",
    closedSessions: "Closed sessions",
    noWaiting: "No waiting sessions.",
    noOpen: "No open sessions.",
    noClosed: "No closed sessions.",

    code: "Code",
    created: "Created",
    presentQr: "Present QR",
    viewResults: "View results",
    closeSession: "Close session",
    closing: "Closing...",
    deletePermanently: "Delete permanently",
    waiting: "Waiting",
    openStatus: "Open",
    closed: "Closed",

    loginRequired:
      "You must log in first.",
    loadModulesError:
      "The modules could not be loaded.",
    loadSessionsError:
      "The feedback sessions could not be loaded.",
    fileTooLarge:
      "is larger than 10 MB.",
    maxFiles:
      "You can upload a maximum of 10 files at once.",
    titleRequired:
      "Please enter a module title.",
    moduleUpdated:
      "Module updated successfully.",
    moduleCreated:
      "Module created successfully.",
    moduleSaveError:
      "The module could not be saved.",
    moduleDeletePrompt:
      "Do you want to delete this module?",
    sessionsRemain:
      "Existing sessions will remain in the history.",
    moduleDeleted:
      "Module deleted successfully.",
    moduleDeleteError:
      "The module could not be deleted.",
    selectModule:
      "Please select an active module.",
    sessionCreateError:
      "The feedback session could not be created.",
    closePrompt:
      "Do you want to close this session?",
    noMoreSubmissions:
      "Participants will no longer be able to submit feedback.",
    sessionClosed:
      "Feedback session closed successfully.",
    sessionCloseError:
      "The feedback session could not be closed.",
    permanentDeletePrompt:
      "Do you want to permanently delete this session?",
    feedbackDeleted:
      "All feedback responses for this session will also be deleted.",
    sessionDeleted:
      "Feedback session permanently deleted.",
    sessionDeleteError:
      "The feedback session could not be deleted.",
    deletedModule: "Deleted module",
  },
};

const createEmptyModuleForm = (
  language = "de"
) => ({
  title: "",
  description: "",
  isActive: true,
  materialFiles: [],
  removedMaterialIds: [],
  feedbackQuestions:
    cloneDefaultQuestions(
      language
    ),
});

function TrainerDashboard() {
  const navigate = useNavigate();

  const [language, setLanguage] =
    useState(
      localStorage.getItem(
        "trainerLanguage"
      ) || "de"
    );

  const t = TEXT[language];

  const [modules, setModules] =
    useState([]);
  const [sessions, setSessions] =
    useState([]);

  const [
    selectedModule,
    setSelectedModule,
  ] = useState("");

  const [
    durationMinutes,
    setDurationMinutes,
  ] = useState("10");

  const [
    expectedParticipants,
    setExpectedParticipants,
  ] = useState("");

  const [
    moduleForm,
    setModuleForm,
  ] = useState(() =>
    createEmptyModuleForm(language)
  );

  const [
    editingModuleId,
    setEditingModuleId,
  ] = useState(null);

  const [
    editingModuleMaterials,
    setEditingModuleMaterials,
  ] = useState([]);

  const [
    materialInputKey,
    setMaterialInputKey,
  ] = useState(0);

  const [
    loadingModules,
    setLoadingModules,
  ] = useState(true);

  const [
    loadingSessions,
    setLoadingSessions,
  ] = useState(true);

  const [
    savingModule,
    setSavingModule,
  ] = useState(false);

  const [
    creatingSession,
    setCreatingSession,
  ] = useState(false);

  const [
    deletingModuleId,
    setDeletingModuleId,
  ] = useState(null);

  const [
    closingSessionId,
    setClosingSessionId,
  ] = useState(null);

  const [
    deletingSessionId,
    setDeletingSessionId,
  ] = useState(null);

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    questionsOpen,
    setQuestionsOpen,
  ] = useState(false);

  const token =
    localStorage.getItem("token");

  const user = useMemo(() => {
    try {
      const storedUser =
        localStorage.getItem("user");

      return storedUser
        ? JSON.parse(storedUser)
        : null;
    } catch {
      return null;
    }
  }, []);

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

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timer =
      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3500);

    return () =>
      window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!error) {
      return undefined;
    }

    const timer =
      window.setTimeout(() => {
        setError("");
      }, 5000);

    return () =>
      window.clearTimeout(timer);
  }, [error]);

  const showError = (message) => {
    setSuccessMessage("");
    setError(message);
  };

  const showSuccess = (message) => {
    setError("");
    setSuccessMessage(message);
  };

  const handleLanguageChange = (
    nextLanguage
  ) => {
    setLanguage(nextLanguage);

    localStorage.setItem(
      "trainerLanguage",
      nextLanguage
    );
  };

  const getModuleTitle = (
    session
  ) => {
    if (session?.module?.title) {
      return session.module.title;
    }

    if (
      session?.moduleSnapshot?.title
    ) {
      return session.moduleSnapshot.title;
    }

    const moduleId =
      typeof session?.module === "string"
        ? session.module
        : session?.module?._id;

    return (
      modules.find(
        (learningModule) =>
          learningModule._id ===
          moduleId
      )?.title || t.deletedModule
    );
  };

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    return new Date(
      value
    ).toLocaleString(
      language === "de"
        ? "de-DE"
        : "en-US"
    );
  };

  const getFileUrl = (fileUrl) => {
    if (!fileUrl) {
      return "";
    }

    if (
      fileUrl.startsWith("http://") ||
      fileUrl.startsWith("https://")
    ) {
      return fileUrl;
    }

    const serverBaseUrl =
      API_URL.replace(/\/api\/?$/, "");

    return `${serverBaseUrl}${fileUrl}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "";
    }

    if (bytes < 1024 * 1024) {
      return `${Math.ceil(
        bytes / 1024
      )} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  const loadModules =
    useCallback(async () => {
      if (!token) {
        setLoadingModules(false);
        return;
      }

      setLoadingModules(true);

      try {
        const response =
          await axios.get(
            `${API_URL}/modules`,
            {
              headers:
                authHeaders,
            }
          );

        const loadedModules =
          response.data.modules || [];

        setModules(loadedModules);

        setSelectedModule(
          (currentValue) => {
            const stillExists =
              loadedModules.some(
                (
                  learningModule
                ) =>
                  learningModule._id ===
                    currentValue &&
                  learningModule.isActive !==
                    false
              );

            if (stillExists) {
              return currentValue;
            }

            return (
              loadedModules.find(
                (
                  learningModule
                ) =>
                  learningModule.isActive !==
                  false
              )?._id || ""
            );
          }
        );
      } catch (requestError) {
        console.error(
          "Load modules error:",
          requestError
        );

        showError(
          requestError.response?.data
            ?.message ||
            t.loadModulesError
        );
      } finally {
        setLoadingModules(false);
      }
    }, [
      authHeaders,
      t.loadModulesError,
      token,
    ]);

  const loadSessions =
    useCallback(async () => {
      if (!token) {
        setLoadingSessions(false);
        return;
      }

      setLoadingSessions(true);

      try {
        const response =
          await axios.get(
            `${API_URL}/sessions`,
            {
              headers:
                authHeaders,
            }
          );

        setSessions(
          response.data.sessions || []
        );
      } catch (requestError) {
        console.error(
          "Load sessions error:",
          requestError
        );

        showError(
          requestError.response?.data
            ?.message ||
            t.loadSessionsError
        );
      } finally {
        setLoadingSessions(false);
      }
    }, [
      authHeaders,
      t.loadSessionsError,
      token,
    ]);

  useEffect(() => {
    if (!token) {
      setLoadingModules(false);
      setLoadingSessions(false);
      showError(t.loginRequired);
      return;
    }

    Promise.all([
      loadModules(),
      loadSessions(),
    ]);
  }, [
    loadModules,
    loadSessions,
    t.loginRequired,
    token,
  ]);

  const resetModuleForm = () => {
    setModuleForm(
      createEmptyModuleForm(language)
    );

    setQuestionsOpen(false);
    setEditingModuleId(null);
    setEditingModuleMaterials([]);

    setMaterialInputKey(
      (current) => current + 1
    );
  };

  const handleModuleInputChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
      files,
    } = event.target;

    if (type === "file") {
      const selectedFiles =
        Array.from(files || []);

      const oversizedFile =
        selectedFiles.find(
          (file) =>
            file.size >
            10 * 1024 * 1024
        );

      if (oversizedFile) {
        showError(
          `"${oversizedFile.name}" ${t.fileTooLarge}`
        );

        event.target.value = "";
        return;
      }

      if (
        selectedFiles.length > 10
      ) {
        showError(t.maxFiles);
        event.target.value = "";
        return;
      }

      setModuleForm(
        (current) => ({
          ...current,
          materialFiles:
            selectedFiles,
        })
      );

      return;
    }

    setModuleForm(
      (current) => ({
        ...current,
        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );
  };

  const updateQuestion = (
    questionKey,
    updates
  ) => {
    setModuleForm(
      (current) => ({
        ...current,
        feedbackQuestions:
          current.feedbackQuestions.map(
            (question, index) =>
              question.key ===
              questionKey
                ? {
                    ...question,
                    ...updates,
                    order: index,
                  }
                : {
                    ...question,
                    order: index,
                  }
          ),
      })
    );
  };

  const addQuestion = (
    type
  ) => {
    if (
      moduleForm.feedbackQuestions
        .length >= 30
    ) {
      showError(
        t.maxQuestions
      );
      return;
    }

    setModuleForm(
      (current) => ({
        ...current,
        feedbackQuestions: [
          ...current.feedbackQuestions,
          {
            key:
              createQuestionKey(),
            text: "",
            type,
            required:
              type === "rating",
            order:
              current
                .feedbackQuestions
                .length,
            isDefault: false,
          },
        ],
      })
    );
  };

  const removeQuestion = (
    questionKey
  ) => {
    setModuleForm(
      (current) => {
        if (
          current
            .feedbackQuestions
            .length <= 1
        ) {
          showError(
            t.atLeastOneQuestion
          );
          return current;
        }

        return {
          ...current,
          feedbackQuestions:
            current.feedbackQuestions
              .filter(
                (question) =>
                  question.key !==
                  questionKey
              )
              .map(
                (
                  question,
                  index
                ) => ({
                  ...question,
                  order: index,
                })
              ),
        };
      }
    );
  };

  const moveQuestion = (
    questionKey,
    direction
  ) => {
    setModuleForm(
      (current) => {
        const questions = [
          ...current.feedbackQuestions,
        ];

        const currentIndex =
          questions.findIndex(
            (question) =>
              question.key ===
              questionKey
          );

        const nextIndex =
          currentIndex +
          direction;

        if (
          currentIndex < 0 ||
          nextIndex < 0 ||
          nextIndex >=
            questions.length
        ) {
          return current;
        }

        [
          questions[currentIndex],
          questions[nextIndex],
        ] = [
          questions[nextIndex],
          questions[currentIndex],
        ];

        return {
          ...current,
          feedbackQuestions:
            questions.map(
              (
                question,
                index
              ) => ({
                ...question,
                order: index,
              })
            ),
        };
      }
    );
  };

  const resetFeedbackQuestions = () => {
    setModuleForm(
      (current) => ({
        ...current,
        feedbackQuestions:
          cloneDefaultQuestions(
            language
          ),
      })
    );
  };

  const handleEditModule = (
    learningModule
  ) => {
    setEditingModuleId(
      learningModule._id
    );

    setQuestionsOpen(true);

    setModuleForm({
      title:
        learningModule.title || "",
      description:
        learningModule.description ||
        "",
      isActive:
        learningModule.isActive !==
        false,
      materialFiles: [],
      removedMaterialIds: [],
      feedbackQuestions:
        normalizeQuestionArray(
          learningModule.feedbackQuestions,
          language
        ),
    });

    setEditingModuleMaterials(
      learningModule.materials || []
    );

    setMaterialInputKey(
      (current) => current + 1
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSaveModule = async (
    event
  ) => {
    event.preventDefault();

    const title =
      moduleForm.title.trim();

    const description =
      moduleForm.description.trim();

    if (!title) {
      showError(t.titleRequired);
      return;
    }

    if (
      moduleForm.feedbackQuestions
        .length === 0
    ) {
      showError(
        t.atLeastOneQuestion
      );
      return;
    }

    const hasEmptyQuestion =
      moduleForm.feedbackQuestions.some(
        (question) =>
          !question.text.trim()
      );

    if (hasEmptyQuestion) {
      showError(
        t.emptyQuestion
      );
      return;
    }

    const normalizedQuestions =
      moduleForm.feedbackQuestions.map(
        (question, index) => ({
          ...question,
          text:
            question.text.trim(),
          order: index,
          required:
            question.type ===
            "rating"
              ? question.required !==
                false
              : Boolean(
                  question.required
                ),
        })
      );

    const formData =
      new FormData();

    formData.append(
      "title",
      title
    );

    formData.append(
      "description",
      description
    );

    formData.append(
      "feedbackQuestions",
      JSON.stringify(
        normalizedQuestions
      )
    );

    moduleForm.materialFiles.forEach(
      (file) => {
        formData.append(
          "materials",
          file
        );
      }
    );

    if (editingModuleId) {
      formData.append(
        "isActive",
        String(
          moduleForm.isActive
        )
      );

      formData.append(
        "removeMaterialIds",
        JSON.stringify(
          moduleForm
            .removedMaterialIds
        )
      );
    }

    setSavingModule(true);

    try {
      if (editingModuleId) {
        await axios.put(
          `${API_URL}/modules/${editingModuleId}`,
          formData,
          {
            headers:
              authHeaders,
          }
        );

        showSuccess(
          t.moduleUpdated
        );
      } else {
        const response =
          await axios.post(
            `${API_URL}/modules`,
            formData,
            {
              headers:
                authHeaders,
            }
          );

        if (
          response.data.module?._id
        ) {
          setSelectedModule(
            response.data.module._id
          );
        }

        showSuccess(
          t.moduleCreated
        );
      }

      resetModuleForm();
      await loadModules();
    } catch (requestError) {
      console.error(
        "Save module error:",
        requestError
      );

      showError(
        requestError.response?.data
          ?.message ||
          t.moduleSaveError
      );
    } finally {
      setSavingModule(false);
    }
  };

  const handleDeleteModule =
    async (learningModule) => {
      const confirmed =
        window.confirm(
          `${t.moduleDeletePrompt}\n\n"${learningModule.title}"\n\n${t.sessionsRemain}`
        );

      if (!confirmed) {
        return;
      }

      setDeletingModuleId(
        learningModule._id
      );

      try {
        await axios.delete(
          `${API_URL}/modules/${learningModule._id}`,
          {
            headers:
              authHeaders,
          }
        );

        if (
          editingModuleId ===
          learningModule._id
        ) {
          resetModuleForm();
        }

        showSuccess(
          t.moduleDeleted
        );

        await Promise.all([
          loadModules(),
          loadSessions(),
        ]);
      } catch (requestError) {
        console.error(
          "Delete module error:",
          requestError
        );

        showError(
          requestError.response
            ?.data?.message ||
            t.moduleDeleteError
        );
      } finally {
        setDeletingModuleId(null);
      }
    };

  const handleCreateSession =
    async (event) => {
      event.preventDefault();

      if (!selectedModule) {
        showError(t.selectModule);
        return;
      }

      const parsedExpectedParticipants =
        expectedParticipants === ""
          ? null
          : Number(
              expectedParticipants
            );

      if (
        parsedExpectedParticipants !==
          null &&
        (
          !Number.isInteger(
            parsedExpectedParticipants
          ) ||
          parsedExpectedParticipants <
            1 ||
          parsedExpectedParticipants >
            10000
        )
      ) {
        showError(
          t.expectedParticipantsInvalid
        );
        return;
      }

      setCreatingSession(true);

      try {
        const response =
          await axios.post(
            `${API_URL}/sessions`,
            {
              module:
                selectedModule,
              durationMinutes:
                Number(
                  durationMinutes
                ),
              expectedParticipants:
                parsedExpectedParticipants,
            },
            {
              headers:
                authHeaders,
            }
          );

        const createdSession =
          response.data.session;

        setExpectedParticipants("");

        await loadSessions();

        if (
          createdSession?._id
        ) {
          navigate(
            `/trainer/sessions/${createdSession._id}/present`
          );
        }
      } catch (requestError) {
        console.error(
          "Create session error:",
          requestError
        );

        showError(
          requestError.response
            ?.data?.message ||
            t.sessionCreateError
        );
      } finally {
        setCreatingSession(false);
      }
    };

  const handleCloseSession =
    async (session) => {
      const confirmed =
        window.confirm(
          `${t.closePrompt}\n\n${session.sessionCode}\n\n${t.noMoreSubmissions}`
        );

      if (!confirmed) {
        return;
      }

      setClosingSessionId(
        session._id
      );

      try {
        await axios.patch(
          `${API_URL}/sessions/${session._id}/close`,
          {},
          {
            headers:
              authHeaders,
          }
        );

        showSuccess(
          t.sessionClosed
        );

        await loadSessions();
      } catch (requestError) {
        console.error(
          "Close session error:",
          requestError
        );

        showError(
          requestError.response
            ?.data?.message ||
            t.sessionCloseError
        );
      } finally {
        setClosingSessionId(null);
      }
    };

  const handleDeleteSession =
    async (session) => {
      const confirmed =
        window.confirm(
          `${t.permanentDeletePrompt}\n\n${session.sessionCode}\n\n${t.feedbackDeleted}`
        );

      if (!confirmed) {
        return;
      }

      setDeletingSessionId(
        session._id
      );

      try {
        await axios.delete(
          `${API_URL}/sessions/${session._id}`,
          {
            headers:
              authHeaders,
          }
        );

        showSuccess(
          t.sessionDeleted
        );

        await loadSessions();
      } catch (requestError) {
        console.error(
          "Delete session error:",
          requestError
        );

        showError(
          requestError.response
            ?.data?.message ||
            t.sessionDeleteError
        );
      } finally {
        setDeletingSessionId(null);
      }
    };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const activeModules =
    modules.filter(
      (learningModule) =>
        learningModule.isActive !==
        false
    );

  const waitingSessions =
    sessions.filter(
      (session) =>
        session.status ===
        "waiting"
    );

  const openSessions =
    sessions.filter(
      (session) =>
        session.status === "open"
    );

  const closedSessions =
    sessions.filter(
      (session) =>
        session.status ===
        "closed"
    );

  const ratingQuestionCount =
    moduleForm.feedbackQuestions.filter(
      (question) =>
        question.type === "rating"
    ).length;

  const textQuestionCount =
    moduleForm.feedbackQuestions.filter(
      (question) =>
        question.type === "text"
    ).length;

  return (
    <main style={styles.page}>
      <section style={styles.container}>
        <header style={styles.header}>
          <div style={styles.brandBlock}>
            <p style={styles.brandTitle}>
              {t.appName}
            </p>

            <h1 style={styles.dashboardTitle}>
              {t.dashboard}
            </h1>

            <p style={styles.userText}>
              {t.welcome},{" "}
              <strong>
                {user?.name ||
                  t.userFallback}
              </strong>
            </p>
          </div>

          <div style={styles.headerActions}>
            <LanguageSwitcher
              language={language}
              onChange={
                handleLanguageChange
              }
            />

            <Link
              to="/feedback"
              style={
                styles.secondaryLink
              }
            >
              {t.openFeedbackForm}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              style={
                styles.logoutButton
              }
            >
              {t.logout}
            </button>
          </div>
        </header>

        {error && (
          <p
            role="alert"
            style={
              styles.errorMessage
            }
          >
            {error}
          </p>
        )}

        {successMessage && (
          <p
            style={
              styles.successMessage
            }
          >
            {successMessage}
          </p>
        )}

        <section style={styles.card}>
          <div
            style={
              styles.sectionHeader
            }
          >
            <h2
              style={
                styles.sectionTitle
              }
            >
              {editingModuleId
                ? t.editModule
                : t.createModule}
            </h2>

            {editingModuleId && (
              <button
                type="button"
                onClick={
                  resetModuleForm
                }
                style={
                  styles.secondaryButton
                }
              >
                {t.cancelEditing}
              </button>
            )}
          </div>

          <form
            onSubmit={
              handleSaveModule
            }
          >
            <div
              style={styles.formGrid}
            >
              <div>
                <label
                  htmlFor="moduleTitle"
                  style={styles.label}
                >
                  {t.moduleTitle}
                </label>

                <input
                  id="moduleTitle"
                  name="title"
                  value={
                    moduleForm.title
                  }
                  onChange={
                    handleModuleInputChange
                  }
                  maxLength={100}
                  disabled={
                    savingModule
                  }
                  style={styles.input}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="moduleDescription"
                  style={styles.label}
                >
                  {t.description}{" "}
                  <span
                    style={
                      styles.optionalText
                    }
                  >
                    ({t.optional})
                  </span>
                </label>

                <textarea
                  id="moduleDescription"
                  name="description"
                  value={
                    moduleForm.description
                  }
                  onChange={
                    handleModuleInputChange
                  }
                  maxLength={1000}
                  disabled={
                    savingModule
                  }
                  rows={4}
                  style={
                    styles.textarea
                  }
                  placeholder={
                    t.optionalDescription
                  }
                />
              </div>
            </div>

            <section
              style={{
                ...styles.subsection,
                padding: questionsOpen
                  ? "clamp(18px, 2vw, 24px)"
                  : "16px 18px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setQuestionsOpen(
                    (current) => !current
                  )
                }
                aria-expanded={
                  questionsOpen
                }
                style={
                  styles.collapsibleHeader
                }
              >
                <span
                  style={
                    styles.collapsibleIcon
                  }
                >
                  {questionsOpen
                    ? "▾"
                    : "▸"}
                </span>

                <span
                  style={
                    styles.collapsibleText
                  }
                >
                  <strong
                    style={
                      styles.collapsibleTitle
                    }
                  >
                    {t.feedbackQuestions}
                  </strong>

                  <span
                    style={
                      styles.collapsibleSummary
                    }
                  >
                    {
                      moduleForm
                        .feedbackQuestions
                        .length
                    }{" "}
                    {t.configuredQuestions}
                    {" · "}
                    {ratingQuestionCount}{" "}
                    {t.ratingShort}
                    {" · "}
                    {textQuestionCount}{" "}
                    {t.textShort}
                  </span>
                </span>

                <span
                  style={
                    styles.collapsibleAction
                  }
                >
                  {questionsOpen
                    ? t.hideQuestions
                    : t.showQuestions}
                </span>
              </button>

              {questionsOpen && (
                <div
                  style={
                    styles.collapsibleContent
                  }
                >
                  <div
                    style={
                      styles.subsectionHeader
                    }
                  >
                    <p
                      style={
                        styles.subsectionText
                      }
                    >
                      {
                        t.feedbackQuestionsHelp
                      }
                    </p>

                    <button
                      type="button"
                      onClick={
                        resetFeedbackQuestions
                      }
                      disabled={
                        savingModule
                      }
                      style={
                        styles.secondaryButton
                      }
                    >
                      {t.resetDefaults}
                    </button>
                  </div>

              <div
                style={
                  styles.questionToolbar
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    addQuestion(
                      "rating"
                    )
                  }
                  disabled={
                    savingModule ||
                    moduleForm
                      .feedbackQuestions
                      .length >= 30
                  }
                  style={
                    styles.addQuestionButton
                  }
                >
                  +{" "}
                  {
                    t.addRatingQuestion
                  }
                </button>

                <button
                  type="button"
                  onClick={() =>
                    addQuestion(
                      "text"
                    )
                  }
                  disabled={
                    savingModule ||
                    moduleForm
                      .feedbackQuestions
                      .length >= 30
                  }
                  style={
                    styles.addQuestionButton
                  }
                >
                  +{" "}
                  {
                    t.addTextQuestion
                  }
                </button>

                <span
                  style={
                    styles.questionCount
                  }
                >
                  {
                    moduleForm
                      .feedbackQuestions
                      .length
                  }
                  /30
                </span>
              </div>

              <div
                style={
                  styles.dynamicQuestionList
                }
              >
                {moduleForm.feedbackQuestions.map(
                  (
                    question,
                    index
                  ) => (
                    <DynamicQuestionRow
                      key={
                        question.key
                      }
                      question={
                        question
                      }
                      index={index}
                      total={
                        moduleForm
                          .feedbackQuestions
                          .length
                      }
                      text={t}
                      disabled={
                        savingModule
                      }
                      onChange={
                        updateQuestion
                      }
                      onRemove={
                        removeQuestion
                      }
                      onMove={
                        moveQuestion
                      }
                    />
                  )
                )}
              </div>

                </div>
              )}
            </section>

            <section
              style={
                styles.subsection
              }
            >
              <label
                htmlFor="moduleMaterials"
                style={styles.label}
              >
                {t.materials}{" "}
                <span
                  style={
                    styles.optionalText
                  }
                >
                  ({t.optional})
                </span>
              </label>

              <input
                key={
                  materialInputKey
                }
                id="moduleMaterials"
                name="materialFiles"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                onChange={
                  handleModuleInputChange
                }
                disabled={
                  savingModule
                }
                style={
                  styles.fileInput
                }
              />

              <p
                style={
                  styles.materialHint
                }
              >
                {t.materialHint}
              </p>

              {moduleForm
                .materialFiles.length >
                0 && (
                <div
                  style={
                    styles.materialList
                  }
                >
                  {moduleForm.materialFiles.map(
                    (file) => (
                      <div
                        key={`${file.name}-${file.lastModified}`}
                        style={
                          styles.selectedFile
                        }
                      >
                        <div>
                          <strong>
                            {file.name}
                          </strong>

                          <span
                            style={
                              styles.fileMeta
                            }
                          >
                            {formatFileSize(
                              file.size
                            )}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setModuleForm(
                              (
                                current
                              ) => ({
                                ...current,
                                materialFiles:
                                  current.materialFiles.filter(
                                    (
                                      currentFile
                                    ) =>
                                      currentFile !==
                                      file
                                  ),
                              })
                            );
                          }}
                          style={
                            styles.smallButton
                          }
                        >
                          {t.remove}
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}

              {editingModuleId &&
                editingModuleMaterials.length >
                  0 && (
                  <div
                    style={
                      styles.currentMaterials
                    }
                  >
                    <p
                      style={
                        styles.currentMaterialsTitle
                      }
                    >
                      {
                        t.currentMaterials
                      }
                    </p>

                    <div
                      style={
                        styles.materialList
                      }
                    >
                      {editingModuleMaterials.map(
                        (
                          material
                        ) => {
                          const removed =
                            moduleForm.removedMaterialIds.includes(
                              material._id
                            );

                          return (
                            <div
                              key={
                                material._id
                              }
                              style={{
                                ...styles.selectedFile,
                                opacity:
                                  removed
                                    ? 0.55
                                    : 1,
                              }}
                            >
                              <div>
                                <strong>
                                  {
                                    material.fileName
                                  }
                                </strong>

                                <span
                                  style={
                                    styles.fileMeta
                                  }
                                >
                                  {formatFileSize(
                                    material.fileSize
                                  )}
                                </span>
                              </div>

                              <div
                                style={
                                  styles.materialActions
                                }
                              >
                                {!removed && (
                                  <a
                                    href={getFileUrl(
                                      material.fileUrl
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={
                                      styles.fileLink
                                    }
                                  >
                                    {
                                      t.open
                                    }
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setModuleForm(
                                      (
                                        current
                                      ) => ({
                                        ...current,
                                        removedMaterialIds:
                                          removed
                                            ? current.removedMaterialIds.filter(
                                                (
                                                  id
                                                ) =>
                                                  id !==
                                                  material._id
                                              )
                                            : [
                                                ...current.removedMaterialIds,
                                                material._id,
                                              ],
                                      })
                                    );
                                  }}
                                  style={
                                    removed
                                      ? styles.smallButton
                                      : styles.smallDangerButton
                                  }
                                >
                                  {removed
                                    ? t.undoRemove
                                    : t.remove}
                                </button>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
            </section>

            {editingModuleId && (
              <label
                style={
                  styles.checkboxLabel
                }
              >
                <input
                  name="isActive"
                  type="checkbox"
                  checked={
                    moduleForm.isActive
                  }
                  onChange={
                    handleModuleInputChange
                  }
                  disabled={
                    savingModule
                  }
                  style={
                    styles.checkbox
                  }
                />

                {t.moduleActive}
              </label>
            )}

            <button
              type="submit"
              disabled={savingModule}
              style={
                styles.primaryButton
              }
            >
              {savingModule
                ? t.saving
                : editingModuleId
                  ? t.saveChanges
                  : t.createModuleButton}
            </button>
          </form>

          <div
            style={styles.divider}
          />

          <h3
            style={styles.listTitle}
          >
            {t.yourModules}
          </h3>

          {loadingModules ? (
            <p
              style={styles.mutedText}
            >
              {t.loadingModules}
            </p>
          ) : modules.length === 0 ? (
            <EmptyState
              title={t.noModules}
              message={
                t.noModulesMessage
              }
            />
          ) : (
            <div
              style={styles.itemList}
            >
              {modules.map(
                (
                  learningModule
                ) => (
                  <article
                    key={
                      learningModule._id
                    }
                    style={
                      styles.listItem
                    }
                  >
                    <div
                      style={
                        styles.itemContent
                      }
                    >
                      <div
                        style={
                          styles.itemTitleRow
                        }
                      >
                        <h4
                          style={
                            styles.itemTitle
                          }
                        >
                          {
                            learningModule.title
                          }
                        </h4>

                        <StatusBadge
                          active={
                            learningModule.isActive !==
                            false
                          }
                          activeText={
                            t.active
                          }
                          inactiveText={
                            t.inactive
                          }
                        />
                      </div>

                      {learningModule.description ? (
                        <p
                          style={
                            styles.itemDescription
                          }
                        >
                          {
                            learningModule.description
                          }
                        </p>
                      ) : (
                        <p
                          style={
                            styles.emptyDescription
                          }
                        >
                          {
                            t.noDescription
                          }
                        </p>
                      )}

                      {learningModule
                        .materials
                        ?.length >
                        0 && (
                        <div
                          style={
                            styles.moduleMaterials
                          }
                        >
                          {learningModule.materials.map(
                            (
                              material
                            ) => (
                              <div
                                key={
                                  material._id
                                }
                                style={
                                  styles.moduleMaterialRow
                                }
                              >
                                <span
                                  style={
                                    styles.materialTypeBadge
                                  }
                                >
                                  {material.fileType ===
                                  "application/pdf"
                                    ? "PDF"
                                    : t.image}
                                </span>

                                <a
                                  href={getFileUrl(
                                    material.fileUrl
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={
                                    styles.moduleMaterialLink
                                  }
                                >
                                  {
                                    material.fileName
                                  }
                                </a>

                                {material.fileSize >
                                  0 && (
                                  <span
                                    style={
                                      styles.fileMeta
                                    }
                                  >
                                    {formatFileSize(
                                      material.fileSize
                                    )}
                                  </span>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    <div
                      style={
                        styles.itemActions
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleEditModule(
                            learningModule
                          )
                        }
                        style={
                          styles.editButton
                        }
                      >
                        {t.edit}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteModule(
                            learningModule
                          )
                        }
                        disabled={
                          deletingModuleId ===
                          learningModule._id
                        }
                        style={
                          styles.dangerButton
                        }
                      >
                        {deletingModuleId ===
                        learningModule._id
                          ? t.deleting
                          : t.delete}
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>

        <section style={styles.card}>
          <div
            style={
              styles.sectionHeader
            }
          >
            <h2
              style={
                styles.sectionTitle
              }
            >
              {t.createSession}
            </h2>
          </div>

          <form
            onSubmit={
              handleCreateSession
            }
            style={
              styles.sessionForm
            }
          >
            <div
              style={
                styles.sessionField
              }
            >
              <label
                htmlFor="selectedModule"
                style={styles.label}
              >
                {t.module}
              </label>

              <select
                id="selectedModule"
                value={
                  selectedModule
                }
                onChange={(event) =>
                  setSelectedModule(
                    event.target.value
                  )
                }
                disabled={
                  loadingModules ||
                  creatingSession
                }
                style={styles.select}
              >
                {activeModules.length ===
                  0 && (
                  <option value="">
                    {
                      t.noActiveModules
                    }
                  </option>
                )}

                {activeModules.map(
                  (
                    learningModule
                  ) => (
                    <option
                      key={
                        learningModule._id
                      }
                      value={
                        learningModule._id
                      }
                    >
                      {
                        learningModule.title
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div
              style={
                styles.durationField
              }
            >
              <label
                htmlFor="durationMinutes"
                style={styles.label}
              >
                {t.duration}
              </label>

              <select
                id="durationMinutes"
                value={
                  durationMinutes
                }
                onChange={(event) =>
                  setDurationMinutes(
                    event.target.value
                  )
                }
                disabled={
                  creatingSession
                }
                style={styles.select}
              >
                {[2, 5, 10, 15, 20, 30].map(
                  (minutes) => (
                    <option
                      key={minutes}
                      value={minutes}
                    >
                      {minutes}{" "}
                      {t.minutes}
                    </option>
                  )
                )}
              </select>
            </div>


            <div
              style={
                styles.participantField
              }
            >
              <label
                htmlFor="expectedParticipants"
                style={styles.label}
              >
                {t.expectedParticipants}{" "}
                <span
                  style={
                    styles.optionalText
                  }
                >
                  (
                  {
                    t.expectedParticipantsOptional
                  }
                  )
                </span>
              </label>

              <input
                id="expectedParticipants"
                type="number"
                min="1"
                max="10000"
                step="1"
                value={
                  expectedParticipants
                }
                onChange={(event) =>
                  setExpectedParticipants(
                    event.target.value
                  )
                }
                placeholder={
                  t.expectedParticipantsPlaceholder
                }
                disabled={
                  creatingSession
                }
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={
                creatingSession ||
                loadingModules ||
                activeModules.length ===
                  0
              }
              style={
                styles.createSessionButton
              }
            >
              {creatingSession
                ? t.creating
                : t.createAndPresent}
            </button>
          </form>
        </section>

        <section style={styles.card}>
          <div
            style={
              styles.sectionHeader
            }
          >
            <h2
              style={
                styles.sectionTitle
              }
            >
              {t.sessionHistory}
            </h2>

            <button
              type="button"
              onClick={loadSessions}
              disabled={
                loadingSessions
              }
              style={
                styles.secondaryButton
              }
            >
              {loadingSessions
                ? t.refreshing
                : t.refresh}
            </button>
          </div>

          {loadingSessions ? (
            <p
              style={styles.mutedText}
            >
              {t.loadingSessions}
            </p>
          ) : sessions.length === 0 ? (
            <EmptyState
              title={t.noSessions}
              message={
                t.noSessionsMessage
              }
            />
          ) : (
            <>
              <SessionGroup
                title={`${t.waitingSessions} (${waitingSessions.length})`}
                sessions={
                  waitingSessions
                }
                emptyMessage={
                  t.noWaiting
                }
                getModuleTitle={
                  getModuleTitle
                }
                formatDate={
                  formatDate
                }
                closingSessionId={
                  closingSessionId
                }
                deletingSessionId={
                  deletingSessionId
                }
                onClose={
                  handleCloseSession
                }
                onDelete={
                  handleDeleteSession
                }
                text={t}
              />

              <SessionGroup
                title={`${t.openSessions} (${openSessions.length})`}
                sessions={
                  openSessions
                }
                emptyMessage={t.noOpen}
                getModuleTitle={
                  getModuleTitle
                }
                formatDate={
                  formatDate
                }
                closingSessionId={
                  closingSessionId
                }
                deletingSessionId={
                  deletingSessionId
                }
                onClose={
                  handleCloseSession
                }
                onDelete={
                  handleDeleteSession
                }
                text={t}
              />

              <SessionGroup
                title={`${t.closedSessions} (${closedSessions.length})`}
                sessions={
                  closedSessions
                }
                emptyMessage={
                  t.noClosed
                }
                getModuleTitle={
                  getModuleTitle
                }
                formatDate={
                  formatDate
                }
                closingSessionId={
                  closingSessionId
                }
                deletingSessionId={
                  deletingSessionId
                }
                onClose={
                  handleCloseSession
                }
                onDelete={
                  handleDeleteSession
                }
                text={t}
              />
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function DynamicQuestionRow({
  question,
  index,
  total,
  text,
  disabled,
  onChange,
  onRemove,
  onMove,
}) {
  return (
    <article
      style={
        styles.questionRow
      }
    >
      <div
        style={
          styles.questionNumber
        }
      >
        {index + 1}
      </div>

      <div
        style={
          styles.questionMain
        }
      >
        <input
          type="text"
          value={question.text}
          onChange={(event) =>
            onChange(
              question.key,
              {
                text:
                  event.target
                    .value,
              }
            )
          }
          maxLength={300}
          disabled={disabled}
          placeholder={
            text.questionPlaceholder
          }
          style={styles.input}
          aria-label={`${text.feedbackQuestions} ${index + 1}`}
          required
        />

        <div
          style={
            styles.questionOptions
          }
        >
          <span
            style={
              question.type ===
              "rating"
                ? styles.ratingTypeBadge
                : styles.textTypeBadge
            }
          >
            {question.type ===
            "rating"
              ? "1–5"
              : "Text"}
          </span>

          <label
            style={
              styles.requiredToggle
            }
          >
            <input
              type="checkbox"
              checked={
                question.required
              }
              onChange={(
                event
              ) =>
                onChange(
                  question.key,
                  {
                    required:
                      event.target
                        .checked,
                  }
                )
              }
              disabled={disabled}
              style={
                styles.checkbox
              }
            />

            {question.required
              ? text.requiredQuestion
              : text.optionalQuestion}
          </label>
        </div>
      </div>

      <div
        style={
          styles.questionActions
        }
      >
        <button
          type="button"
          onClick={() =>
            onMove(
              question.key,
              -1
            )
          }
          disabled={
            disabled ||
            index === 0
          }
          title={text.moveUp}
          aria-label={
            text.moveUp
          }
          style={
            styles.iconButton
          }
        >
          ↑
        </button>

        <button
          type="button"
          onClick={() =>
            onMove(
              question.key,
              1
            )
          }
          disabled={
            disabled ||
            index ===
              total - 1
          }
          title={
            text.moveDown
          }
          aria-label={
            text.moveDown
          }
          style={
            styles.iconButton
          }
        >
          ↓
        </button>

        <button
          type="button"
          onClick={() =>
            onRemove(
              question.key
            )
          }
          disabled={
            disabled ||
            total <= 1
          }
          title={
            text.removeQuestion
          }
          aria-label={
            text.removeQuestion
          }
          style={
            styles.deleteQuestionButton
          }
        >
          ×
        </button>
      </div>
    </article>
  );
}

function SessionGroup({
  title,
  sessions,
  emptyMessage,
  getModuleTitle,
  formatDate,
  closingSessionId,
  deletingSessionId,
  onClose,
  onDelete,
  text,
}) {
  return (
    <div
      style={styles.sessionGroup}
    >
      <h3
        style={styles.groupTitle}
      >
        {title}
      </h3>

      {sessions.length === 0 ? (
        <p
          style={styles.mutedText}
        >
          {emptyMessage}
        </p>
      ) : (
        <div
          style={styles.itemList}
        >
          {sessions.map(
            (session) => (
              <SessionItem
                key={session._id}
                session={session}
                moduleTitle={getModuleTitle(
                  session
                )}
                formatDate={
                  formatDate
                }
                closing={
                  closingSessionId ===
                  session._id
                }
                deleting={
                  deletingSessionId ===
                  session._id
                }
                onClose={onClose}
                onDelete={onDelete}
                text={text}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function SessionItem({
  session,
  moduleTitle,
  formatDate,
  closing,
  deleting,
  onClose,
  onDelete,
  text,
}) {
  const isWaiting =
    session.status === "waiting";

  const isOpen =
    session.status === "open";

  const isClosed =
    session.status === "closed";

  return (
    <article style={styles.listItem}>
      <div
        style={styles.itemContent}
      >
        <div
          style={
            styles.itemTitleRow
          }
        >
          <h4
            style={styles.itemTitle}
          >
            {moduleTitle}
          </h4>

          <SessionStatusBadge
            status={session.status}
            text={text}
          />
        </div>

        <p
          style={
            styles.sessionDetail
          }
        >
          {text.code}:{" "}
          <strong>
            {session.sessionCode}
          </strong>
        </p>

        <p
          style={
            styles.sessionDetail
          }
        >
          {text.duration}:{" "}
          <strong>
            {session.durationMinutes ||
              10}{" "}
            {text.minutes}
          </strong>
        </p>


        {session.expectedParticipants && (
          <p
            style={
              styles.sessionDetail
            }
          >
            {
              text.expectedParticipantsShort
            }
            :{" "}
            <strong>
              {
                session.expectedParticipants
              }
            </strong>
          </p>
        )}

        <p
          style={
            styles.sessionDetail
          }
        >
          {text.created}:{" "}
          {formatDate(
            session.createdAt ||
              session.startTime
          )}
        </p>
      </div>

      <div
        style={styles.itemActions}
      >
        <Link
          to={`/trainer/sessions/${session._id}/present`}
          style={
            styles.presentLink
          }
        >
          {text.presentQr}
        </Link>

        <Link
          to={`/trainer/sessions/${session._id}/results`}
          style={
            styles.resultsLink
          }
        >
          {text.viewResults}
        </Link>

        {(isWaiting || isOpen) && (
          <button
            type="button"
            onClick={() =>
              onClose(session)
            }
            disabled={closing}
            style={
              styles.closeButton
            }
          >
            {closing
              ? text.closing
              : text.closeSession}
          </button>
        )}

        {isClosed && (
          <button
            type="button"
            onClick={() =>
              onDelete(session)
            }
            disabled={deleting}
            style={
              styles.dangerButton
            }
          >
            {deleting
              ? text.deleting
              : text.deletePermanently}
          </button>
        )}
      </div>
    </article>
  );
}

function SessionStatusBadge({
  status,
  text,
}) {
  if (status === "waiting") {
    return (
      <span
        style={
          styles.waitingBadge
        }
      >
        {text.waiting}
      </span>
    );
  }

  if (status === "open") {
    return (
      <span
        style={
          styles.activeBadge
        }
      >
        {text.openStatus}
      </span>
    );
  }

  return (
    <span
      style={
        styles.inactiveBadge
      }
    >
      {text.closed}
    </span>
  );
}

function StatusBadge({
  active,
  activeText,
  inactiveText,
}) {
  return (
    <span
      style={
        active
          ? styles.activeBadge
          : styles.inactiveBadge
      }
    >
      {active
        ? activeText
        : inactiveText}
    </span>
  );
}

function EmptyState({
  title,
  message,
}) {
  return (
    <div
      style={styles.emptyState}
    >
      <strong>
        {title}
      </strong>

      <p
        style={styles.mutedText}
      >
        {message}
      </p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding:
      "clamp(22px, 3vw, 44px) clamp(14px, 3vw, 36px)",
    background:
      "linear-gradient(180deg, #f7f9fc 0%, #eef3f9 100%)",
    color: "#172033",
    fontFamily:
      '"Segoe UI", Inter, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif',
    WebkitFontSmoothing:
      "antialiased",
    MozOsxFontSmoothing:
      "grayscale",
    textRendering:
      "optimizeLegibility",
  },

  container: {
    width:
      "min(1440px, 100%)",
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
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },

  brandBlock: {
    minWidth: 0,
  },

  brandTitle: {
    margin: 0,
    color: "#2563eb",
    fontSize:
      "clamp(2.5rem, 4.5vw, 4rem)",
    fontWeight: 900,
    lineHeight: 0.98,
    letterSpacing: "-0.045em",
  },

  dashboardTitle: {
    margin: "7px 0 0",
    color: "#172033",
    fontSize:
      "clamp(1.65rem, 2.8vw, 2.55rem)",
    lineHeight: 1.05,
    letterSpacing: "-0.035em",
    fontWeight: 760,
  },

  userText: {
    margin: "11px 0 0",
    color: "#526176",
    fontSize: "1rem",
  },

  card: {
    marginTop: "24px",
    padding:
      "clamp(22px, 2.8vw, 38px)",
    border:
      "1px solid rgba(203, 213, 225, 0.7)",
    borderRadius: "22px",
    background: "#ffffff",
    boxShadow:
      "0 16px 42px rgba(15, 23, 42, 0.065)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px",
  },

  sectionTitle: {
    margin: 0,
    fontSize:
      "clamp(1.45rem, 2vw, 1.85rem)",
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
    gap: "20px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#1e293b",
    fontSize: "0.95rem",
    fontWeight: 700,
  },

  input: {
    width: "100%",
    minHeight: "48px",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#172033",
    font: "inherit",
    outline: "none",
  },

  textarea: {
    width: "100%",
    minHeight: "118px",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#172033",
    font: "inherit",
    lineHeight: 1.55,
    resize: "vertical",
    outline: "none",
  },

  optionalText: {
    color: "#64748b",
    fontSize: "0.86rem",
    fontWeight: 500,
  },

  subsection: {
    marginTop: "22px",
    padding:
      "clamp(18px, 2vw, 24px)",
    border: "1px solid #dbe4ef",
    borderRadius: "16px",
    background: "#f8fafc",
  },

  subsectionHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "20px",
  },

  subsectionTitle: {
    margin: 0,
    fontSize: "1.12rem",
    letterSpacing: "-0.01em",
  },

  subsectionText: {
    maxWidth: "760px",
    margin: "7px 0 0",
    color: "#64748b",
    lineHeight: 1.55,
  },

  questionGroup: {
    marginTop: "18px",
  },

  questionGroupTitle: {
    margin: "0 0 10px",
    color: "#475569",
    fontSize: "0.9rem",
    fontWeight: 800,
    letterSpacing: "0.01em",
  },

  questionsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    gap: "16px",
  },

  collapsibleHeader: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: 0,
    border: 0,
    background: "transparent",
    color: "#172033",
    cursor: "pointer",
    font: "inherit",
    textAlign: "left",
  },

  collapsibleIcon: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: "30px",
    height: "30px",
    borderRadius: "9px",
    background: "#eef2ff",
    color: "#3730a3",
    fontSize: "1rem",
    fontWeight: 900,
  },

  collapsibleText: {
    minWidth: 0,
    display: "grid",
    gap: "3px",
    flex: 1,
  },

  collapsibleTitle: {
    fontSize: "1.04rem",
    letterSpacing: "-0.01em",
  },

  collapsibleSummary: {
    color: "#64748b",
    fontSize: "0.86rem",
    fontWeight: 600,
  },

  collapsibleAction: {
    flexShrink: 0,
    color: "#2563eb",
    fontSize: "0.84rem",
    fontWeight: 750,
  },

  collapsibleContent: {
    marginTop: "20px",
    paddingTop: "18px",
    borderTop: "1px solid #dbe4ef",
  },

  questionToolbar: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "16px",
  },

  addQuestionButton: {
    minHeight: "40px",
    padding: "0 14px",
    border: "1px solid #bfdbfe",
    borderRadius: "9px",
    background: "#eff6ff",
    color: "#1d4ed8",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 700,
  },

  questionCount: {
    marginLeft: "auto",
    color: "#64748b",
    fontSize: "0.86rem",
    fontWeight: 700,
  },

  dynamicQuestionList: {
    display: "grid",
    gap: "12px",
  },

  questionRow: {
    display: "grid",
    gridTemplateColumns:
      "42px minmax(0, 1fr) auto",
    alignItems: "start",
    gap: "12px",
    padding: "14px",
    border: "1px solid #dbe4ef",
    borderRadius: "12px",
    background: "#ffffff",
  },

  questionNumber: {
    display: "grid",
    placeItems: "center",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "#eef2ff",
    color: "#3730a3",
    fontSize: "0.88rem",
    fontWeight: 800,
  },

  questionMain: {
    minWidth: 0,
  },

  questionOptions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "9px",
  },

  ratingTypeBadge: {
    padding: "4px 9px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "0.76rem",
    fontWeight: 800,
  },

  textTypeBadge: {
    padding: "4px 9px",
    borderRadius: "999px",
    background: "#ede9fe",
    color: "#6d28d9",
    fontSize: "0.76rem",
    fontWeight: 800,
  },

  requiredToggle: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    color: "#475569",
    fontSize: "0.84rem",
    fontWeight: 700,
  },

  questionActions: {
    display: "flex",
    gap: "6px",
  },

  iconButton: {
    width: "36px",
    height: "36px",
    padding: 0,
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#334155",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 800,
  },

  deleteQuestionButton: {
    width: "36px",
    height: "36px",
    padding: 0,
    border: "1px solid #fecaca",
    borderRadius: "8px",
    background: "#fff1f2",
    color: "#be123c",
    cursor: "pointer",
    font: "inherit",
    fontSize: "1.25rem",
    fontWeight: 700,
  },

  fileInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#172033",
    font: "inherit",
  },

  materialHint: {
    margin: "9px 0 0",
    color: "#64748b",
    fontSize: "0.88rem",
  },

  materialList: {
    display: "grid",
    gap: "10px",
    marginTop: "14px",
  },

  selectedFile: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    padding: "13px 14px",
    border: "1px solid #dbe4ef",
    borderRadius: "11px",
    background: "#ffffff",
  },

  currentMaterials: {
    marginTop: "18px",
  },

  currentMaterialsTitle: {
    margin: 0,
    color: "#475569",
    fontWeight: 700,
  },

  fileMeta: {
    marginLeft: "9px",
    color: "#64748b",
    fontSize: "0.84rem",
  },

  materialActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "9px",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "20px 0",
    fontWeight: 650,
  },

  checkbox: {
    width: "auto",
  },

  primaryButton: {
    minHeight: "48px",
    padding: "0 21px",
    border: 0,
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 750,
    boxShadow:
      "0 8px 18px rgba(37, 99, 235, 0.18)",
  },

  secondaryButton: {
    minHeight: "44px",
    padding: "0 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#172033",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 700,
  },

  smallButton: {
    minHeight: "36px",
    padding: "0 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#172033",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 700,
  },

  smallDangerButton: {
    minHeight: "36px",
    padding: "0 12px",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    background: "#fff1f2",
    color: "#be123c",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 700,
  },

  fileLink: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "36px",
    padding: "0 12px",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    background: "#eff6ff",
    color: "#1d4ed8",
    textDecoration: "none",
    fontWeight: 700,
  },

  divider: {
    height: "1px",
    margin: "34px 0 26px",
    background: "#e2e8f0",
  },

  listTitle: {
    margin: "0 0 17px",
    fontSize: "1.18rem",
  },

  itemList: {
    display: "grid",
    gap: "14px",
  },

  listItem: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "18px",
    padding: "18px",
    border: "1px solid #dbe4ef",
    borderRadius: "14px",
    background: "#f8fafc",
  },

  itemContent: {
    flex: "1 1 440px",
    minWidth: 0,
  },

  itemTitleRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },

  itemTitle: {
    margin: 0,
    fontSize: "1.08rem",
  },

  itemDescription: {
    margin: "8px 0 0",
    color: "#64748b",
    lineHeight: 1.55,
  },

  emptyDescription: {
    margin: "8px 0 0",
    color: "#94a3b8",
    fontStyle: "italic",
  },

  itemActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },

  moduleMaterials: {
    display: "grid",
    gap: "8px",
    marginTop: "12px",
  },

  moduleMaterialRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
  },

  materialTypeBadge: {
    padding: "4px 8px",
    borderRadius: "999px",
    background: "#e2e8f0",
    color: "#475569",
    fontSize: "0.75rem",
    fontWeight: 800,
  },

  moduleMaterialLink: {
    color: "#1d4ed8",
    textDecoration: "none",
    fontWeight: 700,
  },

  editButton: {
    minHeight: "40px",
    padding: "0 15px",
    border: "1px solid #bfdbfe",
    borderRadius: "9px",
    background: "#eff6ff",
    color: "#1d4ed8",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 700,
  },

  dangerButton: {
    minHeight: "40px",
    padding: "0 15px",
    border: "1px solid #fecaca",
    borderRadius: "9px",
    background: "#fff1f2",
    color: "#be123c",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 700,
  },

  activeBadge: {
    padding: "5px 10px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "0.8rem",
    fontWeight: 750,
  },

  waitingBadge: {
    padding: "5px 10px",
    borderRadius: "999px",
    background: "#fef3c7",
    color: "#92400e",
    fontSize: "0.8rem",
    fontWeight: 750,
  },

  inactiveBadge: {
    padding: "5px 10px",
    borderRadius: "999px",
    background: "#e2e8f0",
    color: "#475569",
    fontSize: "0.8rem",
    fontWeight: 750,
  },

  emptyState: {
    padding: "24px",
    border: "1px dashed #cbd5e1",
    borderRadius: "13px",
    background: "#f8fafc",
  },

  mutedText: {
    marginBottom: 0,
    color: "#64748b",
    lineHeight: 1.55,
  },

  sessionForm: {
    display: "grid",
    gridTemplateColumns:
      "minmax(300px, 2fr) minmax(170px, 0.7fr) minmax(210px, 0.9fr) auto",
    alignItems: "end",
    gap: "18px",
  },

  sessionField: {
    minWidth: 0,
  },

  durationField: {
    minWidth: 0,
  },

  participantField: {
    minWidth: 0,
  },

  createSessionButton: {
    minHeight: "48px",
    padding: "0 24px",
    border: 0,
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 750,
    whiteSpace: "nowrap",
    boxShadow:
      "0 8px 18px rgba(37, 99, 235, 0.18)",
  },

  select: {
    width: "100%",
    minHeight: "48px",
    padding: "0 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#172033",
    font: "inherit",
  },

  sessionGroup: {
    marginTop: "28px",
  },

  groupTitle: {
    margin: "0 0 14px",
    fontSize: "1.1rem",
  },

  sessionDetail: {
    margin: "7px 0 0",
    color: "#64748b",
  },

  presentLink: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "40px",
    padding: "0 15px",
    border: "1px solid #bfdbfe",
    borderRadius: "9px",
    background: "#eff6ff",
    color: "#1d4ed8",
    textDecoration: "none",
    fontWeight: 700,
  },

  resultsLink: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "40px",
    padding: "0 15px",
    border: "1px solid #bbf7d0",
    borderRadius: "9px",
    background: "#f0fdf4",
    color: "#166534",
    textDecoration: "none",
    fontWeight: 700,
  },

  closeButton: {
    minHeight: "40px",
    padding: "0 15px",
    border: "1px solid #fed7aa",
    borderRadius: "9px",
    background: "#fff7ed",
    color: "#c2410c",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 700,
  },

  secondaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "46px",
    padding: "0 18px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#172033",
    textDecoration: "none",
    fontWeight: 700,
  },

  logoutButton: {
    minHeight: "46px",
    padding: "0 18px",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    background: "#fff1f2",
    color: "#be123c",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 700,
  },

  errorMessage: {
    margin: "0 0 16px",
    padding: "14px 16px",
    borderRadius: "11px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 650,
  },

  successMessage: {
    margin: "0 0 16px",
    padding: "14px 16px",
    borderRadius: "11px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 650,
  },
};

export default TrainerDashboard;
