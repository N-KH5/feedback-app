import { useState } from "react";
import { Link } from "react-router";

import api from "../services/api";

function RegisterPage() {
  const [form, setForm] =
    useState({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (
        currentForm
      ) => ({
        ...currentForm,
        [name]: value,
      })
    );
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    setSubmitting(true);

    try {
      const response =
        await api.post(
          "/auth/register",
          {
            name:
              form.name.trim(),

            email:
              form.email
                .trim()
                .toLowerCase(),

            password:
              form.password,
          }
        );

      const {
        token,
        user,
      } = response.data;

      if (!token || !user) {
        throw new Error(
          "The server returned an invalid registration response."
        );
      }

      localStorage.setItem(
        "token",
        token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      window.location.href =
        "/trainer";
    } catch (requestError) {
      setError(
        requestError.response?.data
          ?.message ||
          requestError.message ||
          "Registration failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <p style={styles.appName}>
          Feedback
        </p>

        <h1 style={styles.title}>
          Trainer Registration
        </h1>

        <p style={styles.subtitle}>
          Create your trainer
          account.
        </p>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <label
            htmlFor="name"
            style={styles.label}
          >
            Name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            minLength={2}
            autoComplete="name"
            style={styles.input}
          />

          <label
            htmlFor="email"
            style={styles.label}
          >
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            style={styles.input}
          />

          <label
            htmlFor="password"
            style={styles.label}
          >
            Password
          </label>

          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            autoComplete="new-password"
            style={styles.input}
          />

          <label
            htmlFor="confirmPassword"
            style={styles.label}
          >
            Confirm password
          </label>

          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={
              form.confirmPassword
            }
            onChange={handleChange}
            required
            minLength={8}
            autoComplete="new-password"
            style={styles.input}
          />

          <button
            type="submit"
            disabled={
              submitting
            }
            style={{
              ...styles.button,

              opacity:
                submitting
                  ? 0.7
                  : 1,

              cursor:
                submitting
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {submitting
              ? "Creating account..."
              : "Create account"}
          </button>
        </form>

        {error && (
          <p
            role="alert"
            style={styles.error}
          >
            {error}
          </p>
        )}

        <p style={styles.footer}>
          Already have an
          account?{" "}
          <Link
            to="/login"
            style={styles.link}
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "20px",

    background:
      "linear-gradient(180deg, #f7f9fc 0%, #eef3f9 100%)",

    fontFamily:
      "Inter, system-ui, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "500px",
    padding: "36px",

    border:
      "1px solid rgba(203, 213, 225, 0.7)",

    borderRadius: "20px",
    background: "#ffffff",

    boxShadow:
      "0 16px 42px rgba(15, 23, 42, 0.08)",
  },

  appName: {
    margin: "0 0 18px",
    color: "#2563eb",
    textAlign: "center",
    fontSize: "2.6rem",
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: "-0.04em",
  },

  title: {
    margin: 0,
    color: "#172033",
    textAlign: "center",
    fontSize: "2.2rem",
    lineHeight: 1.1,
  },

  subtitle: {
    margin: "12px 0 28px",
    color: "#64748b",
    textAlign: "center",
    fontSize: "1.05rem",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#172033",
    fontWeight: 700,
  },

  input: {
    width: "100%",
    minHeight: "48px",
    boxSizing: "border-box",
    padding: "12px 14px",
    marginBottom: "18px",

    border:
      "1px solid #cbd5e1",

    borderRadius: "10px",
    color: "#172033",
    background: "#ffffff",
    fontSize: "1rem",
    outline: "none",
  },

  button: {
    width: "100%",
    minHeight: "48px",
    padding: "12px",

    border: 0,
    borderRadius: "10px",

    background: "#2563eb",
    color: "#ffffff",

    fontSize: "1rem",
    fontWeight: 700,
  },

  error: {
    marginTop: "18px",
    marginBottom: 0,
    padding: "12px",

    borderRadius: "10px",
    background: "#fee2e2",
    color: "#991b1b",
  },

  footer: {
    margin: "22px 0 0",
    color: "#64748b",
    textAlign: "center",
  },

  link: {
    color: "#2563eb",
    fontWeight: 800,
    textDecoration: "none",
  },
};

export default RegisterPage;