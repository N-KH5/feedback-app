function LanguageSwitcher({
  language,
  onChange,
}) {
  return (
    <div
      className="language-switcher"
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        className={`language-icon-button ${
          language === "de"
            ? "active"
            : ""
        }`}
        onClick={() =>
          onChange("de")
        }
        aria-label="Deutsch"
        title="Deutsch"
        aria-pressed={
          language === "de"
        }
      >
        <span
          className="language-flag"
          aria-hidden="true"
        >
          🇩🇪
        </span>
      </button>

      <button
        type="button"
        className={`language-icon-button ${
          language === "en"
            ? "active"
            : ""
        }`}
        onClick={() =>
          onChange("en")
        }
        aria-label="English"
        title="English"
        aria-pressed={
          language === "en"
        }
      >
        <span
          className="language-flag"
          aria-hidden="true"
        >
          🇬🇧
        </span>
      </button>
    </div>
  );
}

export default LanguageSwitcher;