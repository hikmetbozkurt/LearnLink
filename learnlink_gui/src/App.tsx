import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import ChatroomsPage from "./pages/ChatroomsPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import CoursesPage from "./pages/CoursesPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import EventsPage from "./pages/EventsPage";
import ProgressPage from "./pages/ProgressPage";
import SupportPage from "./pages/SupportPage";
import Layout from "./components/Layout/Layout";
import RouteGuard from './components/RouteGuard';
import DirectMessagesPage from './pages/DirectMessagesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CourseArea from './components/Course/CourseArea';
import CourseAreaWrapper from './components/Course/CourseAreaWrapper';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Auth Routes - No Layout */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Routes - With Layout */}
        <Route element={<RouteGuard><Layout /></RouteGuard>}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/chatrooms" element={<ChatroomsPage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/courses" element={<CoursesPage />}>
            <Route index element={<CourseAreaWrapper />} />
            <Route path=":courseId" element={<CourseDetailPage />} />
          </Route>
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/direct-messages" element={<DirectMessagesPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
