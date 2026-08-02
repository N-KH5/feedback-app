import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";
import LanguageSwitcher from "../components/LanguageSwitcher";

const TEXT = {
  de: {
    appName: "Feedback",
    dashboard: "Admin-Dashboard",
    subtitle: "Trainerkonten verwalten",
    logout: "Abmelden",
    trainers: "Trainer",
    refresh: "Aktualisieren",
    refreshing: "Wird aktualisiert...",
    loading: "Trainer werden geladen...",
    noTrainers: "Keine Trainerkonten vorhanden.",
    name: "Name",
    email: "E-Mail",
    status: "Status",
    created: "Erstellt",
    actions: "Aktionen",
    active: "Aktiv",
    inactive: "Inaktiv",
    edit: "Bearbeiten",
    resetPassword: "Passwort zurücksetzen",
    delete: "Löschen",
    editTrainer: "Trainer bearbeiten",
    activeAccount: "Aktives Konto",
    saveChanges: "Änderungen speichern",
    saving: "Wird gespeichert...",
    cancel: "Abbrechen",
    resetPasswordTitle: "Passwort zurücksetzen",
    resetPasswordDescription:
      "Lege ein neues Passwort für {name} fest.",
    newPassword: "Neues Passwort",
    resetPasswordButton: "Passwort zurücksetzen",
    resetting: "Wird zurückgesetzt...",
    deletePrompt:
      'Trainer "{name}" endgültig löschen?',
    loadError:
      "Die Trainer konnten nicht geladen werden.",
    updateSuccess:
      "Trainer erfolgreich aktualisiert.",
    updateError:
      "Der Trainer konnte nicht aktualisiert werden.",
    deleteSuccess:
      "Trainer erfolgreich gelöscht.",
    deleteError:
      "Der Trainer konnte nicht gelöscht werden.",
    resetSuccess:
      "Trainerpasswort erfolgreich zurückgesetzt.",
    resetError:
      "Das Passwort konnte nicht zurückgesetzt werden.",
  },

  en: {
    appName: "Feedback",
    dashboard: "Admin Dashboard",
    subtitle: "Manage trainer accounts",
    logout: "Log out",
    trainers: "Trainers",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    loading: "Loading trainers...",
    noTrainers: "No trainer accounts are available.",
    name: "Name",
    email: "Email",
    status: "Status",
    created: "Created",
    actions: "Actions",
    active: "Active",
    inactive: "Inactive",
    edit: "Edit",
    resetPassword: "Reset password",
    delete: "Delete",
    editTrainer: "Edit trainer",
    activeAccount: "Active account",
    saveChanges: "Save changes",
    saving: "Saving...",
    cancel: "Cancel",
    resetPasswordTitle: "Reset password",
    resetPasswordDescription:
      "Set a new password for {name}.",
    newPassword: "New password",
    resetPasswordButton: "Reset password",
    resetting: "Resetting...",
    deletePrompt:
      'Delete trainer "{name}" permanently?',
    loadError:
      "The trainers could not be loaded.",
    updateSuccess:
      "Trainer updated successfully.",
    updateError:
      "The trainer could not be updated.",
    deleteSuccess:
      "Trainer deleted successfully.",
    deleteError:
      "The trainer could not be deleted.",
    resetSuccess:
      "Trainer password reset successfully.",
    resetError:
      "The password could not be reset.",
  },
};

function AdminDashboard() {
  const [language, setLanguage] =
    useState(
      localStorage.getItem(
        "adminLanguage"
      ) || "de"
    );

  const text = TEXT[language];

  const [trainers, setTrainers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("");

  const [
    editingTrainer,
    setEditingTrainer,
  ] = useState(null);

  const [
    resetPasswordTrainer,
    setResetPasswordTrainer,
  ] = useState(null);

  const [
    savingTrainer,
    setSavingTrainer,
  ] = useState(false);

  const [
    resettingPassword,
    setResettingPassword,
  ] = useState(false);

  const [editForm, setEditForm] =
    useState({
      name: "",
      email: "",
      isActive: true,
    });

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const locale =
    language === "de"
      ? "de-DE"
      : "en-US";

  const formatDate = useCallback(
    (value) => {
      if (!value) {
        return "-";
      }

      return new Date(
        value
      ).toLocaleDateString(
        locale
      );
    },
    [locale]
  );

  const showMessage = (
    type,
    value
  ) => {
    setMessageType(type);
    setMessage(value);
  };

  const loadTrainers = useCallback(
    async ({
      silent = false,
    } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setMessage("");

      try {
        const response =
          await api.get(
            "/admin/trainers"
          );

        setTrainers(
          response.data.trainers || []
        );
      } catch (error) {
        showMessage(
          "error",
          error.response?.data
            ?.message ||
            text.loadError
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [text.loadError]
  );

  useEffect(() => {
    loadTrainers();
  }, [loadTrainers]);

  const handleLanguageChange = (
    nextLanguage
  ) => {
    setLanguage(nextLanguage);

    localStorage.setItem(
      "adminLanguage",
      nextLanguage
    );
  };

  const startEditing = (
    trainer
  ) => {
    setEditingTrainer(trainer);

    setEditForm({
      name: trainer.name || "",
      email: trainer.email || "",
      isActive:
        trainer.isActive !== false,
    });

    setMessage("");
  };

  const cancelEditing = () => {
    setEditingTrainer(null);

    setEditForm({
      name: "",
      email: "",
      isActive: true,
    });
  };

  const updateTrainer = async (
    event
  ) => {
    event.preventDefault();

    if (!editingTrainer) {
      return;
    }

    setSavingTrainer(true);
    setMessage("");

    try {
      const response =
        await api.patch(
          `/admin/trainers/${editingTrainer._id}`,
          {
            name:
              editForm.name.trim(),
            email:
              editForm.email
                .trim()
                .toLowerCase(),
            isActive:
              editForm.isActive,
          }
        );

      setTrainers(
        (currentTrainers) =>
          currentTrainers.map(
            (trainer) =>
              trainer._id ===
              editingTrainer._id
                ? response.data
                    .trainer
                : trainer
          )
      );

      cancelEditing();

      showMessage(
        "success",
        text.updateSuccess
      );
    } catch (error) {
      showMessage(
        "error",
        error.response?.data
          ?.message ||
          text.updateError
      );
    } finally {
      setSavingTrainer(false);
    }
  };

  const deleteTrainer = async (
    trainer
  ) => {
    const confirmed =
      window.confirm(
        text.deletePrompt.replace(
          "{name}",
          trainer.name
        )
      );

    if (!confirmed) {
      return;
    }

    setMessage("");

    try {
      await api.delete(
        `/admin/trainers/${trainer._id}`
      );

      setTrainers(
        (currentTrainers) =>
          currentTrainers.filter(
            (currentTrainer) =>
              currentTrainer._id !==
              trainer._id
          )
      );

      showMessage(
        "success",
        text.deleteSuccess
      );
    } catch (error) {
      showMessage(
        "error",
        error.response?.data
          ?.message ||
          text.deleteError
      );
    }
  };

  const openPasswordReset = (
    trainer
  ) => {
    setResetPasswordTrainer(
      trainer
    );
    setNewPassword("");
    setMessage("");
  };

  const closePasswordReset =
    () => {
      setResetPasswordTrainer(
        null
      );
      setNewPassword("");
    };

  const resetPassword = async (
    event
  ) => {
    event.preventDefault();

    if (!resetPasswordTrainer) {
      return;
    }

    setResettingPassword(true);
    setMessage("");

    try {
      await api.patch(
        `/admin/trainers/${resetPasswordTrainer._id}/password`,
        {
          password: newPassword,
        }
      );

      closePasswordReset();

      showMessage(
        "success",
        text.resetSuccess
      );
    } catch (error) {
      showMessage(
        "error",
        error.response?.data
          ?.message ||
          text.resetError
      );
    } finally {
      setResettingPassword(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href =
      "/login";
  };

  const activeCount = useMemo(
    () =>
      trainers.filter(
        (trainer) =>
          trainer.isActive !== false
      ).length,
    [trainers]
  );

  return (
    <main className="admin-dashboard">
      <section className="admin-dashboard__container">
        <header className="admin-dashboard__header">
          <div className="admin-dashboard__brand">
            <p className="admin-dashboard__app-name">
              {text.appName}
            </p>

            <h1 className="admin-dashboard__title">
              {text.dashboard}
            </h1>

            <p className="admin-dashboard__subtitle">
              {text.subtitle}
            </p>
          </div>

          <div className="admin-dashboard__header-actions">
            <LanguageSwitcher
              language={language}
              onChange={
                handleLanguageChange
              }
            />

            <button
              type="button"
              onClick={logout}
              className="admin-dashboard__logout-button"
            >
              {text.logout}
            </button>
          </div>
        </header>

        {message && (
          <p
            role={
              messageType === "error"
                ? "alert"
                : "status"
            }
            className={`admin-dashboard__message admin-dashboard__message--${messageType}`}
          >
            {message}
          </p>
        )}

        <section className="admin-dashboard__summary-grid">
          <article className="admin-dashboard__summary-card">
            <span>
              {text.trainers}
            </span>

            <strong>
              {trainers.length}
            </strong>
          </article>

          <article className="admin-dashboard__summary-card">
            <span>
              {text.active}
            </span>

            <strong>
              {activeCount}
            </strong>
          </article>

          <article className="admin-dashboard__summary-card">
            <span>
              {text.inactive}
            </span>

            <strong>
              {trainers.length -
                activeCount}
            </strong>
          </article>
        </section>

        <section className="admin-dashboard__section">
          <div className="admin-dashboard__section-header">
            <h2>
              {text.trainers}
            </h2>

            <button
              type="button"
              onClick={() =>
                loadTrainers({
                  silent: true,
                })
              }
              disabled={refreshing}
              className="admin-dashboard__secondary-button"
            >
              {refreshing
                ? text.refreshing
                : text.refresh}
            </button>
          </div>

          {loading ? (
            <p className="admin-dashboard__muted-text">
              {text.loading}
            </p>
          ) : trainers.length ===
            0 ? (
            <div className="admin-dashboard__empty-state">
              <strong>
                {text.noTrainers}
              </strong>
            </div>
          ) : (
            <div className="admin-dashboard__table-wrapper">
              <table className="admin-dashboard__table">
                <thead>
                  <tr>
                    <th>
                      {text.name}
                    </th>
                    <th>
                      {text.email}
                    </th>
                    <th>
                      {text.status}
                    </th>
                    <th>
                      {text.created}
                    </th>
                    <th>
                      {text.actions}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {trainers.map(
                    (trainer) => (
                      <tr
                        key={
                          trainer._id
                        }
                      >
                        <td
                          data-label={
                            text.name
                          }
                        >
                          <strong>
                            {trainer.name}
                          </strong>
                        </td>

                        <td
                          data-label={
                            text.email
                          }
                        >
                          {trainer.email}
                        </td>

                        <td
                          data-label={
                            text.status
                          }
                        >
                          <span
                            className={
                              trainer.isActive !==
                              false
                                ? "admin-dashboard__badge admin-dashboard__badge--active"
                                : "admin-dashboard__badge admin-dashboard__badge--inactive"
                            }
                          >
                            {trainer.isActive !==
                            false
                              ? text.active
                              : text.inactive}
                          </span>
                        </td>

                        <td
                          data-label={
                            text.created
                          }
                        >
                          {formatDate(
                            trainer.createdAt
                          )}
                        </td>

                        <td
                          data-label={
                            text.actions
                          }
                        >
                          <div className="admin-dashboard__actions">
                            <button
                              type="button"
                              onClick={() =>
                                startEditing(
                                  trainer
                                )
                              }
                              className="admin-dashboard__edit-button"
                            >
                              {
                                text.edit
                              }
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openPasswordReset(
                                  trainer
                                )
                              }
                              className="admin-dashboard__secondary-button"
                            >
                              {
                                text.resetPassword
                              }
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteTrainer(
                                  trainer
                                )
                              }
                              className="admin-dashboard__danger-button"
                            >
                              {
                                text.delete
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {editingTrainer && (
          <section className="admin-dashboard__panel">
            <div className="admin-dashboard__section-header">
              <h2>
                {
                  text.editTrainer
                }
              </h2>
            </div>

            <form
              onSubmit={
                updateTrainer
              }
              className="admin-dashboard__form"
            >
              <label>
                <span>
                  {text.name}
                </span>

                <input
                  type="text"
                  value={
                    editForm.name
                  }
                  onChange={(
                    event
                  ) =>
                    setEditForm(
                      (
                        current
                      ) => ({
                        ...current,
                        name:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>
                  {text.email}
                </span>

                <input
                  type="email"
                  value={
                    editForm.email
                  }
                  onChange={(
                    event
                  ) =>
                    setEditForm(
                      (
                        current
                      ) => ({
                        ...current,
                        email:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  required
                />
              </label>

              <label className="admin-dashboard__checkbox-label">
                <input
                  type="checkbox"
                  checked={
                    editForm.isActive
                  }
                  onChange={(
                    event
                  ) =>
                    setEditForm(
                      (
                        current
                      ) => ({
                        ...current,
                        isActive:
                          event
                            .target
                            .checked,
                      })
                    )
                  }
                />

                <span>
                  {
                    text.activeAccount
                  }
                </span>
              </label>

              <div className="admin-dashboard__actions">
                <button
                  type="submit"
                  disabled={
                    savingTrainer
                  }
                  className="admin-dashboard__primary-button"
                >
                  {savingTrainer
                    ? text.saving
                    : text.saveChanges}
                </button>

                <button
                  type="button"
                  onClick={
                    cancelEditing
                  }
                  className="admin-dashboard__secondary-button"
                >
                  {text.cancel}
                </button>
              </div>
            </form>
          </section>
        )}

        {resetPasswordTrainer && (
          <section className="admin-dashboard__panel">
            <div className="admin-dashboard__section-header">
              <div>
                <h2>
                  {
                    text.resetPasswordTitle
                  }
                </h2>

                <p className="admin-dashboard__muted-text">
                  {text.resetPasswordDescription.replace(
                    "{name}",
                    resetPasswordTrainer.name
                  )}
                </p>
              </div>
            </div>

            <form
              onSubmit={
                resetPassword
              }
              className="admin-dashboard__form"
            >
              <label>
                <span>
                  {
                    text.newPassword
                  }
                </span>

                <input
                  type="password"
                  value={
                    newPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setNewPassword(
                      event.target
                        .value
                    )
                  }
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </label>

              <div className="admin-dashboard__actions">
                <button
                  type="submit"
                  disabled={
                    resettingPassword
                  }
                  className="admin-dashboard__primary-button"
                >
                  {resettingPassword
                    ? text.resetting
                    : text.resetPasswordButton}
                </button>

                <button
                  type="button"
                  onClick={
                    closePasswordReset
                  }
                  className="admin-dashboard__secondary-button"
                >
                  {text.cancel}
                </button>
              </div>
            </form>
          </section>
        )}
      </section>
    </main>
  );
}

export default AdminDashboard;
