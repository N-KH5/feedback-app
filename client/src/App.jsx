import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import "./App.css";

import AdminDashboard from "./pages/AdminDashboard";
import FeedbackPage from "./pages/FeedbackPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SessionPresentationPage from "./pages/SessionPresentationPage";
import SessionResultsPage from "./pages/SessionResultsPage";
import TrainerDashboard from "./pages/TrainerDashboard";

function getStoredUser() {
  try {
    const storedUser =
      localStorage.getItem("user");

    return storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch {
    return null;
  }
}

function ProtectedRoute({
  allowedRoles,
  children,
}) {
  const token =
    localStorage.getItem("token");

  const user =
    getStoredUser();

  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    Array.isArray(
      allowedRoles
    ) &&
    !allowedRoles.includes(
      user.role
    )
  ) {
    return (
      <Navigate
        to={
          user.role === "admin"
            ? "/admin"
            : "/trainer"
        }
        replace
      />
    );
  }

  return children;
}

function PublicOnlyRoute({
  children,
}) {
  const token =
    localStorage.getItem("token");

  const user =
    getStoredUser();

  if (
    token &&
    user?.role
  ) {
    return (
      <Navigate
        to={
          user.role === "admin"
            ? "/admin"
            : "/trainer"
        }
        replace
      />
    );
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to="/feedback"
            replace
          />
        }
      />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute
            allowedRoles={[
              "admin",
            ]}
          >
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trainer"
        element={
          <ProtectedRoute
            allowedRoles={[
              "trainer",
            ]}
          >
            <TrainerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trainer/sessions/:sessionId/present"
        element={
          <ProtectedRoute
            allowedRoles={[
              "trainer",
              "admin",
            ]}
          >
            <SessionPresentationPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trainer/sessions/:sessionId/results"
        element={
          <ProtectedRoute
            allowedRoles={[
              "trainer",
              "admin",
            ]}
          >
            <SessionResultsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/feedback"
        element={
          <FeedbackPage />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/feedback"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;
