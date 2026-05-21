import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "../pages/Login";
import { ChatAI } from "../pages/ChatAI";
import { Dashboard } from "../pages/Dashboard";
import { MemoryGame } from "../pages/MemoryGame";
import { ProtectedRoute } from "./ProtectedRoute";

export const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flashcards/memory"
          element={
            <ProtectedRoute>
              <MemoryGame />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatAI />
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};
