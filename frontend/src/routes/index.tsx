import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Lessons } from '../pages/Lessons';
import { LessonPlayer } from '../pages/LessonPlayer';
import { Flashcards } from '../pages/Flashcards';
import { SignRecognition } from '../pages/SignRecognition';
import { TextTranslate } from '../pages/TextTranslate';
import { ChatAI } from '../pages/ChatAI';
import { Profile } from '../pages/Profile';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { MemoryGame } from "../pages/MemoryGame";

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
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="lessons" element={<Lessons />} />
          <Route path="lessons/:lessonId" element={<LessonPlayer />} />
          <Route path="flashcards" element={<Flashcards />} />
          <Route path="recognition" element={<SignRecognition />} />
          <Route path="translate" element={<TextTranslate />} />
          <Route path="chat" element={<ChatAI />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};
